import { filter, type Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getCommunicator } from "../../data/scene-data";
import { getSceneComponent, getSceneService } from "./scene-component-helpers";
import { CommandBusService } from "./command-bus.service";
import { SimulationTickService } from "./simulation-tick.service";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { SceneActorCreator } from "./scene-actor-creator";
import { SelectionGroupsComponent } from "../../player/human-controller/selection-groups.component";
import {
  type ActorDefinition,
  type PlayerNumber,
  type ProbableWafflePlayerStateData,
  ProbableWaffleGatewayEvent,
  type ProbableWaffleSnapshotResponseEvent,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";

/**
 * Handles the reconnect flow for a client that drops and rejoins mid-game.
 *
 * On `init()` this service:
 *  - Subscribes to `snapshot-response` from the host.
 *  - Hooks into the Socket.IO `connect` event so if the socket reconnects
 *    (network drop / brief disconnection), it re-joins the game room and
 *    requests a full snapshot from the host.
 *
 * The `player-disconnected` and `player-reconnected` events emitted by the
 * server arrive through the normal TwoWayCommunicator channels and are
 * consumed by other clients to pause/resume the simulation (future: step 15).
 * For now they are logged.
 *
 * Single-player: all communicators are undefined → this service is a no-op.
 */
export class ReconnectService {
  private snapshotSub?: Subscription;
  private socketConnectHandler?: () => void;
  private socketDisconnectHandler?: (reason: string) => void;
  /** Stored so destroy() can call removeListener. */
  private rawSocket?: any;

  init(scene: ProbableWaffleScene): void {
    const communicator = getCommunicator(scene);
    if (!communicator.snapshotRequested || !communicator.snapshotResponse) {
      // Single-player — nothing to do.
      return;
    }

    // Receive snapshot responses.  The host's SnapshotService echoes the snapshot
    // back to all clients; only the one that actually requested it should apply it.
    // We gate on whether we are NOT the host — hosts serve, non-hosts apply.
    if (!scene.isHost) {
      this.snapshotSub = communicator.snapshotResponse.on.subscribe(
        (e: ProbableWaffleSnapshotResponseEvent) => {
          if (e.targetUserId !== scene.userId) {
            return;
          }
          this.applySnapshot(scene, e);
        }
      );

      if (scene.isSpectator) {
        this.requestSnapshot(scene, "spectator catch-up");
      }
    }

    // Hook into socket reconnect so we can re-join the room and catch up.
    const socket = communicator.activeSocket;
    if (socket) {
      this.socketConnectHandler = () => {
        // `connect` fires both on initial connection AND on reconnect; ignore
        // the very first connect (the game scene is not running yet at that point).
        // By the time this service is init-ed, the first connect already happened,
        // so any subsequent `connect` event is a reconnect.
        this.onSocketReconnect(scene);
      };
      this.socketDisconnectHandler = (reason: string) => {
        this.onSocketDisconnect(scene, reason);
      };
      // Use the underlying socket.io socket via ngx-socket-io's ioSocket property.
      const rawSocket = (socket as any).ioSocket;
      if (rawSocket) {
        this.rawSocket = rawSocket;
        rawSocket.on("connect", this.socketConnectHandler);
        rawSocket.on("disconnect", this.socketDisconnectHandler);
      }
    }
  }

  private onSocketReconnect(scene: ProbableWaffleScene): void {
    console.info("[Reconnect] Socket reconnected — re-joining room and requesting snapshot from host.");

    // Re-join the socket.io room with the new socket ID.
    getCommunicator(scene).activeSocket?.emit(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom, {
      gameInstanceId: scene.gameInstanceId,
      type: "join"
    } satisfies ProbableWaffleWebsocketRoomEvent);

    this.requestSnapshot(scene, "reconnect");
  }

  private requestSnapshot(scene: ProbableWaffleScene, reason: string): void {
    const communicator = getCommunicator(scene);
    if (!communicator.snapshotRequested) return;

    console.info(`[Reconnect] Requesting host snapshot for ${reason}.`);

    communicator.snapshotRequested.send({
      gameInstanceId: scene.gameInstanceId,
      emitterUserId: scene.userId,
      reason: reason === "reconnect" ? "reconnect" : "spectator-catch-up"
    });
  }

  private onSocketDisconnect(scene: ProbableWaffleScene, reason: string): void {
    scene.events.emit("local-connection-lost", {
      playerNumber: scene.playerOrNull?.playerNumber ?? scene.player?.playerNumber,
      reason
    });
  }

  private applySnapshot(scene: ProbableWaffleScene, response: ProbableWaffleSnapshotResponseEvent): void {
    const snapshot = response.snapshot;
    const simTick = getSceneService(scene, SimulationTickService);
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    const commandBus = getSceneService(scene, CommandBusService);
    const creator = getSceneService(scene, SceneActorCreator);
    // Use a distinct reason ("snapshot-restore") so this pause does not collide with
    // ConnectionRecoveryService's "reconnect" pause, which has independent lifetime.
    const pauseReason = response.reason === "desync-correction" ? "desync-correction" : "snapshot-restore";

    if (!actorIndex || !creator) {
      console.error("[Reconnect] Required services not available; cannot apply snapshot.");
      return;
    }

    console.info(
      `[Reconnect] Applying snapshot at tick ${snapshot.tick}. Actors: ${snapshot.actors.length}. ` +
        `Buffered tail batches: ${response.commandTail?.length ?? 0}. Reason: ${response.reason ?? "reconnect"}`
    );

    simTick?.pauseTick(pauseReason);

    // Destroy all current actors before re-creating from snapshot.
    const currentActors = [...actorIndex.getAllIdActors()];
    for (const actor of currentActors) {
      actor.destroy();
    }

    // Re-create actors from the snapshot definitions.
    for (const def of snapshot.actors) {
      creator.createActorFromDefinition(def as ActorDefinition);
    }

    // Restore per-player state data (resources, housing, summary, selection).
    for (const [playerNumberStr, stateData] of Object.entries(snapshot.playerStates)) {
      const playerNumber = Number(playerNumberStr) as PlayerNumber;
      const player = scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
      if (player) {
        Object.assign(player.playerState.data, stateData as ProbableWafflePlayerStateData);
      }
    }

    // Restore mirrored control groups and repopulate the live local hotkey component.
    for (const [playerNumberStr, selectionGroups] of Object.entries(snapshot.playerSelectionGroups ?? {})) {
      const playerNumber = Number(playerNumberStr) as PlayerNumber;
      const player = scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
      if (!player) {
        continue;
      }

      player.playerController.data.selectionGroups = structuredClone(selectionGroups);
      if (playerNumber === scene.player?.playerNumber) {
        getSceneComponent(scene, SelectionGroupsComponent)?.setGroups(selectionGroups);
      }
    }

    // Restore research state.
    if (snapshot.playerResearch) {
      const gameStateData = scene.baseGameData.gameInstance.gameState?.data;
      if (gameStateData) {
        gameStateData.playerResearch = snapshot.playerResearch;
      }
    }

    // Advance sim clock to match the snapshot so command sequences stay coherent.
    simTick?.fastForwardTo(snapshot.tick);
    commandBus?.resetAfterSnapshot(
      snapshot.tick,
      (response.commandTail ?? []).map((batch) => ({
        tick: batch.tick,
        playerNumber: batch.playerNumber,
        commands: batch.commands
      }))
    );

    simTick?.resumeTick(pauseReason);
    if (response.reason === "desync-correction") {
      simTick?.resumeTick("desync");
    }

    if (response.reason === "desync-correction") {
      console.warn(`[DESYNC] Applied host correction snapshot at tick ${snapshot.tick}.`);
    }
    scene.events.emit("reconnect-snapshot-applied", {
      reason: response.reason,
      tick: snapshot.tick
    });
    console.info("[Reconnect] Snapshot applied. Simulation resumed.");
  }

  destroy(): void {
    this.snapshotSub?.unsubscribe();
    if (this.socketConnectHandler && this.rawSocket) {
      this.rawSocket.off("connect", this.socketConnectHandler);
    }
    if (this.socketDisconnectHandler && this.rawSocket) {
      this.rawSocket.off("disconnect", this.socketDisconnectHandler);
    }
  }
}
