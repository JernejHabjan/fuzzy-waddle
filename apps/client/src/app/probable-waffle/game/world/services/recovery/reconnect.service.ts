import { filter, type Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneComponent, getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../command-bus.service";
import { SimulationTickService } from "../simulation-tick.service";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { SceneActorCreator } from "../scene-actor-creator";
import { SelectionGroupsComponent } from "../../../player/human-controller/selection-groups.component";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "../../../entity/components/id-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import {
  type ActorDefinition,
  type PlayerNumber,
  type ProbableWafflePlayerStateData,
  ProbableWaffleGatewayEvent,
  type ProbableWaffleInstanceReseedRequiredEvent,
  type ProbableWaffleSnapshotResponseEvent,
  type ProbableWaffleWebsocketRoomEvent
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleSceneEventName } from "./probable-waffle-scene-events";

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
  private instanceReseedRequiredSub?: Subscription;
  /** Stored so destroy() can call removeListener. */
  private rawSocket?: any;
  private awaitingReconnect = false;
  private reseedSent = false;

  init(scene: ProbableWaffleScene): void {
    const communicator = getCommunicator(scene);
    if (!communicator.snapshotRequested || !communicator.snapshotResponse) {
      // Single-player — nothing to do.
      return;
    }

    // Receive snapshot responses.  The host's SnapshotService echoes the snapshot
    // back to all clients; only the one that actually requested it should apply it.
    // We gate on whether we are NOT the host — hosts serve, non-hosts apply.
    // Gateway now routes snapshot responses directly to targetUserId, but this
    // guard is intentionally kept for compatibility with older relay behavior.
    if (!scene.isHost) {
      this.snapshotSub = communicator.snapshotResponse.on.subscribe((e: ProbableWaffleSnapshotResponseEvent) => {
        if (e.targetUserId !== scene.userId) {
          return;
        }
        this.applySnapshot(scene, e);
      });

      if (scene.isSpectator) {
        this.requestSnapshot(scene, "spectator catch-up");
      }
    }

    this.instanceReseedRequiredSub = communicator.instanceReseedRequired?.on
      .pipe(filter((event: ProbableWaffleInstanceReseedRequiredEvent) => event.reason === "missing-game-instance"))
      .subscribe(() => this.handleInstanceReseedRequired(scene));

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

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private onSocketReconnect(scene: ProbableWaffleScene): void {
    if (!this.awaitingReconnect) {
      return;
    }
    this.awaitingReconnect = false;
    console.info("[Reconnect] Socket reconnected — re-joining room and requesting snapshot from host.");

    // Re-join the socket.io room with the new socket ID.
    getCommunicator(scene).activeSocket?.emit(ProbableWaffleGatewayEvent.ProbableWaffleWebsocketRoom, {
      gameInstanceId: scene.gameInstanceId,
      type: "join"
    } satisfies ProbableWaffleWebsocketRoomEvent);

    if (scene.isHost) {
      // Host is authoritative and does not consume snapshot responses, so reconnect
      // should resume immediately after room rejoin. Also push a reseed payload to
      // restore server-side in-memory instance after backend restart.
      this.sendInstanceReseedPayload(scene);
      scene.events.emit(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, {
        reason: "reconnect"
      });
      return;
    }

    this.requestSnapshot(scene, "reconnect");
  }

  /**
   * Handles server "instance missing" signal after backend restart.
   *
   * The goal is to restore authoritative server-side state first, then request a fresh snapshot.
   */
  private handleInstanceReseedRequired(scene: ProbableWaffleScene): void {
    if (!scene.isHost) {
      console.warn(
        "[Reconnect] Server requested reseed on non-host client. Waiting for host reseed before requesting snapshot."
      );
      return;
    }
    if (this.reseedSent || !this.sendInstanceReseedPayload(scene)) {
      return;
    }

    console.warn("[Reconnect] Server requested instance reseed. Sending current game instance payload.");
    this.requestSnapshot(scene, "reconnect");
  }

  /** Sends a full game-instance payload so the API can recreate missing in-memory state. */
  private sendInstanceReseedPayload(scene: ProbableWaffleScene): boolean {
    const communicator = getCommunicator(scene);
    if (!communicator.instanceReseed) {
      return false;
    }
    this.reseedSent = true;
    communicator.instanceReseed.sendToServer({
      gameInstanceId: scene.gameInstanceId,
      emitterUserId: scene.userId,
      gameInstanceData: structuredClone(scene.baseGameData.gameInstance.data)
    });
    return true;
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
    this.awaitingReconnect = true;
    scene.events.emit(ProbableWaffleSceneEventName.LocalConnectionLost, {
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

    const snapshotActorIds = new Set(
      snapshot.actors.map((actor) => actor.id?.id).filter((actorId): actorId is string => !!actorId)
    );

    // Destroy all current actors before re-creating from snapshot.
    const currentActors = [...actorIndex.getAllIdActors()];
    const removedActorDiagnostics = currentActors
      .map((actor) => {
        const id = getActorComponent(actor, IdComponent)?.id;
        if (!id || snapshotActorIds.has(id)) {
          return undefined;
        }
        const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
        const logicalTransform = getGameObjectLogicalTransform(actor);
        return {
          id,
          name: actor.name,
          owner,
          x: logicalTransform ? Math.round(logicalTransform.x) : undefined,
          y: logicalTransform ? Math.round(logicalTransform.y) : undefined,
          z: logicalTransform ? Math.round(logicalTransform.z) : undefined
        };
      })
      .filter((diagnostic) => diagnostic !== undefined);
    if (removedActorDiagnostics.length > 0) {
      console.warn(
        `[Reconnect] Snapshot ${response.reason ?? "reconnect"} will remove ${removedActorDiagnostics.length} local actors not present on host snapshot.`,
        removedActorDiagnostics
      );
    }

    for (const actor of currentActors) {
      actor.destroy();
    }

    // Re-create actors from the snapshot definitions.
    const createdSnapshotActorIds = new Set<string>();
    for (const def of snapshot.actors) {
      const created = creator.createActorFromDefinition(def as ActorDefinition);
      const createdActorId = created ? getActorComponent(created, IdComponent)?.id : undefined;
      if (createdActorId) {
        createdSnapshotActorIds.add(createdActorId);
      }
    }
    const missingAfterRestore = [...snapshotActorIds].filter((id) => !createdSnapshotActorIds.has(id));
    if (missingAfterRestore.length > 0) {
      console.error(
        `[Reconnect] Snapshot restore missing ${missingAfterRestore.length} actors after recreation. reason=${response.reason ?? "reconnect"}.`,
        missingAfterRestore
      );
    }

    // Restore per-player state data (resources, housing, summary, selection).
    for (const [playerNumberStr, stateData] of Object.entries(snapshot.playerStates)) {
      const playerNumber = Number(playerNumberStr) as PlayerNumber;
      const player = scene.baseGameData.gameInstance.getPlayerByNumber(playerNumber);
      if (player) {
        Object.assign(player.playerState.data, stateData);
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
    this.reseedSent = false;
    scene.events.emit(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, {
      reason: response.reason,
      tick: snapshot.tick
    });
    console.info("[Reconnect] Snapshot applied. Simulation resumed.");
  }

  destroy(): void {
    this.snapshotSub?.unsubscribe();
    this.instanceReseedRequiredSub?.unsubscribe();
    this.awaitingReconnect = false;
    this.reseedSent = false;
    if (this.socketConnectHandler && this.rawSocket) {
      this.rawSocket.off("connect", this.socketConnectHandler);
    }
    if (this.socketDisconnectHandler && this.rawSocket) {
      this.rawSocket.off("disconnect", this.socketDisconnectHandler);
    }
  }
}
