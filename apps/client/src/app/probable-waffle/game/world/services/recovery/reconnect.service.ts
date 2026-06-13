import { filter, type Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getCommunicator } from "../../../data/scene-data";
import { getSceneComponent, getSceneService } from "../scene-component-helpers";
import { CommandBusService } from "../multiplayer/command-bus.service";
import { SimulationTickService } from "../simulation-tick.service";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { SceneActorCreator } from "../scene-actor-creator";
import { SelectionGroupsComponent } from "../../../player/human-controller/selection-groups.component";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "../../../entity/components/id-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { applyActorDefinitionToActor } from "../../../data/actor-data";
import {
  type ActorDefinition,
  GameSessionState,
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
    if (!this.shouldHandleReconnectFlow(scene)) {
      // Ignore disconnects during pre-game startup/lobby transitions.
      // Those reconnects should not force a snapshot restore because simulation
      // has not started yet and a fresh startup seed/metadata sync is sufficient.
      return;
    }
    this.awaitingReconnect = true;
    scene.events.emit(ProbableWaffleSceneEventName.LocalConnectionLost, {
      playerNumber: scene.playerOrNull?.playerNumber ?? scene.player?.playerNumber,
      reason
    });
  }

  /**
   * Restricts reconnect snapshot flow to active gameplay phases.
   * This avoids unnecessary startup snapshot restores while players are still
   * joining/loading and no in-progress simulation state needs correction.
   */
  private shouldHandleReconnectFlow(scene: ProbableWaffleScene): boolean {
    const sessionState = scene.baseGameData.gameInstance.gameInstanceMetadata.data.sessionState;
    return sessionState === GameSessionState.InProgress || sessionState === GameSessionState.ToScoreScreen;
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
    scene.data.set("snapshotApplyInProgress", true);

    try {
      const snapshotActorIds = new Set(
        snapshot.actors.map((actor) => actor.id?.id).filter((actorId): actorId is string => !!actorId)
      );
      const snapshotActorById = new Map(
        snapshot.actors
          .filter((actor): actor is ActorDefinition & { id: { id: string } } => !!actor.id?.id)
          .map((actor) => [actor.id.id, actor])
      );

      const currentActors = [...actorIndex.getAllIdActors()];
      if (response.reason === "desync-correction") {
        // Desync correction preserves the live scene where possible so users do not
        // see a full world rebuild for a small divergence. Reconnect/spectator
        // catch-up instead rebuilds from scratch because arbitrary lifecycle events
        // may have been missed while the client was away.
        this.applyActorSnapshotInPlace(actorIndex, creator, currentActors, snapshot.actors as ActorDefinition[]);
      } else {
        // Reconnect and spectator catch-up rebuild from a clean baseline because the
        // client may have missed arbitrary actor lifecycle events while offline.
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
      for (const def of snapshot.actors) {
        creator.createActorFromDefinition(def as ActorDefinition);
      }

      this.reconcileSnapshotActorIds(actorIndex, snapshot.actors as ActorDefinition[]);

      const indexedActorIds = new Set(
        actorIndex
          .getAllIdActors()
          .map((actor) => getActorComponent(actor, IdComponent)?.id)
          .filter((actorId): actorId is string => !!actorId)
      );
      const missingInIndexAfterReconcile = [...snapshotActorIds].filter((id) => !indexedActorIds.has(id));
      if (missingInIndexAfterReconcile.length > 0) {
        for (const missingId of missingInIndexAfterReconcile) {
          const missingDef = snapshotActorById.get(missingId);
          if (!missingDef) {
            continue;
          }
          const recreated = creator.createActorFromDefinition(missingDef);
          const recreatedId = recreated ? getActorComponent(recreated, IdComponent)?.id : undefined;
          if (recreatedId === missingId) {
            indexedActorIds.add(missingId);
          }
        }
      }

      const finalIndexedActorIds = new Set(
        actorIndex
          .getAllIdActors()
          .map((actor) => getActorComponent(actor, IdComponent)?.id)
          .filter((actorId): actorId is string => !!actorId)
      );
      const missingAfterRestore = [...snapshotActorIds].filter((id) => !finalIndexedActorIds.has(id));
      const extrasAfterRestore = [...finalIndexedActorIds].filter((id) => !snapshotActorIds.has(id));
      if (missingAfterRestore.length > 0 || extrasAfterRestore.length > 0) {
        const missingSummaries = missingAfterRestore.map((id) => ({
          id,
          name: snapshotActorById.get(id)?.name ?? "unknown",
          signature: this.buildSnapshotActorSignature(snapshotActorById.get(id))
        }));
        const extraSummaries = actorIndex
          .getAllIdActors()
          .map((actor) => {
            const id = getActorComponent(actor, IdComponent)?.id;
            if (!id || snapshotActorIds.has(id)) {
              return undefined;
            }
            return {
              id,
              name: actor.name,
              signature: this.buildLiveActorSignature(actor)
            };
          })
          .filter((entry) => entry !== undefined);
        console.error(
          `[Reconnect] Snapshot restore mismatch after recreation. reason=${response.reason ?? "reconnect"} missing=${missingAfterRestore.length} extra=${extrasAfterRestore.length}.`,
          {
            missingActors: missingSummaries,
            extraActors: extraSummaries
          }
        );
      }
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
      // Suppress "late registration" diagnostics briefly after snapshot rebuild.
      scene.data.set("snapshotApplySuppressedUntilTick", snapshot.tick + 5);
      console.info("[Reconnect] Snapshot applied. Simulation resumed.");
    } finally {
      scene.data.set("snapshotApplyInProgress", false);
    }
  }

  /**
   * Desync correction updates only actors that differ from the host snapshot.
   * This avoids the visible twitch caused by destroying and rebuilding the whole scene.
   */
  private applyActorSnapshotInPlace(
    actorIndex: ActorIndexSystem,
    creator: SceneActorCreator,
    currentActors: readonly Phaser.GameObjects.GameObject[],
    snapshotActors: readonly ActorDefinition[]
  ): void {
    // The host snapshot is authoritative on ids, names, and transforms. Applying
    // in place avoids twitchy full-scene rebuilds while still converging every
    // actor to the host's deterministic state.
    const liveActorById = new Map(
      currentActors
        .map((actor) => [getActorComponent(actor, IdComponent)?.id, actor] as const)
        .filter((entry): entry is [string, Phaser.GameObjects.GameObject] => !!entry[0])
    );
    const snapshotActorIds = new Set(
      snapshotActors.map((actor) => actor.id?.id).filter((actorId): actorId is string => !!actorId)
    );

    let updated = 0;
    let created = 0;
    let destroyed = 0;
    for (const snapshotActor of snapshotActors) {
      const actorId = snapshotActor.id?.id;
      if (!actorId) {
        continue;
      }
      const liveActor = liveActorById.get(actorId);
      if (liveActor) {
        if (snapshotActor.name && liveActor.name !== snapshotActor.name) {
          liveActor.destroy();
          destroyed += 1;
          if (creator.createActorFromDefinition(snapshotActor)) {
            created += 1;
          }
          continue;
        }
        applyActorDefinitionToActor(liveActor, snapshotActor);
        updated += 1;
      } else if (creator.createActorFromDefinition(snapshotActor)) {
        created += 1;
      }
    }

    for (const liveActor of currentActors) {
      const liveActorId = getActorComponent(liveActor, IdComponent)?.id;
      if (liveActorId && !snapshotActorIds.has(liveActorId)) {
        liveActor.destroy();
        destroyed += 1;
      }
    }

    const finalIds = new Set(
      actorIndex
        .getAllIdActors()
        .map((actor) => getActorComponent(actor, IdComponent)?.id)
        .filter((actorId): actorId is string => !!actorId)
    );
    const missing = [...snapshotActorIds].filter((actorId) => !finalIds.has(actorId));
    if (missing.length > 0) {
      console.error(`[DESYNC] In-place correction still missing ${missing.length} actors after apply.`, missing);
    }
    console.warn(
      `[DESYNC] In-place host correction reconciled actors. updated=${updated} created=${created} destroyed=${destroyed}`
    );
  }

  /**
   * Some actors can exist locally with a different deterministic id but identical spawn signature.
   * Reassign those ids to the authoritative host snapshot ids to stop endless actor-missing loops.
   */
  private reconcileSnapshotActorIds(actorIndex: ActorIndexSystem, snapshotActors: readonly ActorDefinition[]): void {
    const currentActors = actorIndex.getAllIdActors();
    const localById = new Map(
      currentActors
        .map((actor) => [getActorComponent(actor, IdComponent)?.id, actor] as const)
        .filter((entry): entry is [string, Phaser.GameObjects.GameObject] => !!entry[0])
    );
    const localBySignature = new Map<string, Phaser.GameObjects.GameObject[]>();
    for (const actor of currentActors) {
      const signature = this.buildLiveActorSignature(actor);
      if (!signature) {
        continue;
      }
      const bucket = localBySignature.get(signature) ?? [];
      bucket.push(actor);
      localBySignature.set(signature, bucket);
    }

    for (const snapshotActor of snapshotActors) {
      const authoritativeId = snapshotActor.id?.id;
      if (!authoritativeId || localById.has(authoritativeId)) {
        continue;
      }

      const signature = this.buildSnapshotActorSignature(snapshotActor);
      if (!signature) {
        continue;
      }
      const candidates = localBySignature.get(signature);
      if (!candidates || candidates.length === 0) {
        continue;
      }

      const actorToRelabel = candidates.find((candidate) => {
        const candidateId = getActorComponent(candidate, IdComponent)?.id;
        return !!candidateId && !localById.has(candidateId);
      });
      if (!actorToRelabel) {
        continue;
      }

      const idComponent = getActorComponent(actorToRelabel, IdComponent);
      const previousId = idComponent?.id;
      if (!idComponent || previousId === authoritativeId) {
        continue;
      }

      idComponent.setId(authoritativeId);
      if (previousId) {
        localById.delete(previousId);
      }
      localById.set(authoritativeId, actorToRelabel);
      console.warn(
        `[Reconnect] Reconciled actor id by signature. oldId=${previousId ?? "none"} newId=${authoritativeId} signature=${signature}`
      );
    }
  }

  private buildSnapshotActorSignature(actorDefinition: ActorDefinition | undefined): string | null {
    if (!actorDefinition?.name) {
      return null;
    }
    const logical = actorDefinition.representable?.logicalWorldTransform;
    const x = logical ? Math.round(logical.x) : 0;
    const y = logical ? Math.round(logical.y) : 0;
    const z = logical ? Math.round(logical.z) : 0;
    const owner = actorDefinition.owner?.ownerId ?? -1;
    return `${actorDefinition.name}|${owner}|${x}|${y}|${z}`;
  }

  private buildLiveActorSignature(actor: Phaser.GameObjects.GameObject): string | null {
    const logical = getGameObjectLogicalTransform(actor);
    if (!logical) {
      return null;
    }
    const owner = getActorComponent(actor, OwnerComponent)?.getOwner() ?? -1;
    return `${actor.name}|${owner}|${Math.round(logical.x)}|${Math.round(logical.y)}|${Math.round(logical.z)}`;
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
