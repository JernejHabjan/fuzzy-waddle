import type {
  ProbableWaffleReplayDesyncDiagnostic,
  ProbableWaffleStateHashDiagnostics
} from "@fuzzy-waddle/api-interfaces";
import type { Subscription } from "rxjs";
import { getSceneService } from "../scene-component-helpers";
import { SimulationTickService } from "../simulation-tick.service";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { getActorComponent } from "../../../data/actor-component";
import { IdComponent } from "../../../entity/components/id-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { HealingComponent } from "../../../entity/components/combat/components/healing-component";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { getCommunicator } from "../../../data/scene-data";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { SnapshotService } from "./snapshot.service";
import { ActorManager } from "../../../data/actor-manager";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import { ProbableWaffleSceneEventName } from "./probable-waffle-scene-events";
import type { ReconnectSnapshotAppliedSceneEvent } from "./probable-waffle-scene-events";
import { createMultiplayerClientLogger } from "../multiplayer/multiplayer-client-logger";

interface HashSnapshot {
  hash: string;
  diagnostics?: ProbableWaffleStateHashDiagnostics;
}

/**
 * Hash every 20 ticks = 1 second at 20 Hz.
 * This catches divergence quickly enough for correction before actors drift too far apart.
 */
const HASH_INTERVAL_TICKS = 20;

/**
 * Keep local hashes for this many ticks in case a peer message arrives slightly late.
 * In practice the peer hash arrives within 1–2 ticks of ours.
 */
const HASH_STORE_TICKS = 120;
/** Keep enabled so mismatch logs can always explain exactly what diverged. */
const INCLUDE_HASH_DIAGNOSTICS_IN_STEADY_STATE = true;

interface PendingCorrection {
  emitterUserId: string;
  playerNumber: number;
  firstDetectedTick: number;
  lastCorrectionTick: number;
  correctionAttempts: number;
  reason?: string;
}

/**
 * Computes a periodic deterministic hash of all actor states and exchanges it with
 * peers to detect simulation divergence. Only active in multiplayer — no-op in SP.
 *
 * Hash scope per actor: {id, health, tileX, tileY, owner}. Actors sorted by ID
 * so every client produces an identical string for the same simulation state.
 *
 * On mismatch: logs a structured error and shows a persistent on-screen indicator on
 * the desynced client while automatic snapshot correction retries run.
 */
export class StateHashService {
  private readonly logger = createMultiplayerClientLogger("StateHash");
  private readonly localHashes = new Map<number, HashSnapshot>();
  private tickSub?: Subscription;
  private hashReceivedSub?: Subscription;
  private scene?: ProbableWaffleScene;
  /** Lightweight debug overlay; shown immediately on mismatch for quick visual feedback. */
  private desyncText?: Phaser.GameObjects.Text;
  private readonly pendingCorrections = new Map<number, PendingCorrection>();
  /** Tracks current mismatch reason per remote player for log deduping and dialog auto-close signaling. */
  private readonly activeMismatches = new Map<number, string>();
  /** Emits periodic mismatch logs even when reason text stays unchanged. */
  private readonly lastMismatchLogTickByPlayer = new Map<number, number>();
  private missingLocalHashLogSignature: string | null = null;

  /** Subscribes to sim ticks and peer hash relay; disabled automatically in singleplayer. */
  init(scene: ProbableWaffleScene): void {
    this.scene = scene;
    const communicator = getCommunicator(scene);
    if (!communicator.stateHashChanged) return; // SP: no-op

    const tickService = getSceneService(scene, SimulationTickService);
    if (!tickService) return;

    this.tickSub = tickService.tick$.subscribe((tick) => this.onTick(tick, scene));

    // Each client broadcasts its own hash; compare incoming peer hashes against local.
    this.hashReceivedSub = communicator.stateHashChanged.on.subscribe((event) => {
      // Ignore the echo of our own hash (TwoWayCommunicator fires sendLocally as well).
      if (event.emitterUserId === scene.userId) return;
      this.compareRemoteHash(event, scene);
    });
    scene.events.on(ProbableWaffleSceneEventName.ReconnectSnapshotApplied, this.onReconnectSnapshotApplied, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Emits local hash snapshots on a fixed tick interval and retains a short comparison history. */
  private onTick(tick: number, scene: ProbableWaffleScene): void {
    if (tick % HASH_INTERVAL_TICKS !== 0) return;

    // Keep steady-state payload small, but switch to rich diagnostics while any
    // mismatch/correction flow is active so logs can explain exactly what diverged.
    const includeDiagnostics =
      INCLUDE_HASH_DIAGNOSTICS_IN_STEADY_STATE || this.activeMismatches.size > 0 || this.pendingCorrections.size > 0;
    const snapshot = this.computeHashSnapshot(scene, includeDiagnostics);
    this.localHashes.set(tick, snapshot);
    this.pruneOldHashes(tick);

    const communicator = getCommunicator(scene);
    const playerNumber = scene.playerOrNull?.playerNumber ?? null;
    if (playerNumber === null) return;

    communicator.stateHashChanged!.send({
      gameInstanceId: scene.gameInstanceId,
      emitterUserId: scene.userId ?? "",
      tick,
      playerNumber,
      hash: snapshot.hash,
      diagnostics: snapshot.diagnostics
    });
  }

  /**
   * Build the hash string from all tracked actors sorted by their stable ID.
   * Uses integer positions (Math.round) to avoid float divergence from display rounding.
   */
  private computeHashSnapshot(scene: Phaser.Scene, includeDiagnostics: boolean): HashSnapshot {
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    if (!actorIndex) {
      return {
        hash: "",
        diagnostics: includeDiagnostics
          ? {
              actorDigests: {},
              playerDigests: [],
              researchDigest: ""
            }
          : undefined
      };
    }

    const actorDigests = includeDiagnostics ? ({} as Record<string, string>) : undefined;
    const entries = actorIndex
      .getAllIdActors()
      .filter((go) => !this.shouldIgnoreForStateHash(go))
      .map((go) => {
        const id = getActorComponent(go, IdComponent)?.id ?? "";
        const health = getActorComponent(go, HealthComponent)?.healthComponentData.health ?? -1;
        const armour = getActorComponent(go, HealthComponent)?.healthComponentData.armour ?? -1;
        const tile = getGameObjectCurrentTile(go);
        const pos = getGameObjectLogicalTransform(go);
        const lx = tile ? tile.x : pos ? Math.round(pos.x) : 0;
        const ly = tile ? tile.y : pos ? Math.round(pos.y) : 0;
        const lz = pos ? Math.round(pos.z) : 0;
        const owner = getActorComponent(go, OwnerComponent)?.getOwner() ?? -1;
        const actor = ActorManager.getActorDefinitionFromActor(go) ?? {};
        const queueState = this.serializeActorQueueState(actor);
        const economyState = this.serializeActorEconomyState(actor);
        const combatState = this.serializeActorCombatState(go);
        const orderState = this.serializeActorOrderState(go);
        const actorDigest = `${id}:${go.name}:${Math.round(health)}:${Math.round(armour)}:${lx}:${ly}:${lz}:${owner}:${queueState}:${economyState}:${combatState}:${orderState}`;
        if (actorDigests) {
          actorDigests[id] = actorDigest;
        }
        return actorDigest;
      });

    // Sort by the ID prefix (first segment before ':') for deterministic ordering.
    entries.sort();
    const playerStateEntries = this.serializePlayerStates(scene);
    const researchEntries = this.serializeResearchState(scene);
    return {
      hash: djb2(`${entries.join("|")}#${playerStateEntries.join("|")}#${researchEntries.join("|")}`),
      diagnostics: includeDiagnostics
        ? {
            actorDigests: actorDigests ?? {},
            playerDigests: playerStateEntries,
            researchDigest: researchEntries.join("|")
          }
        : undefined
    };
  }

  private compareRemoteHash(
    event: {
      tick: number;
      hash: string;
      playerNumber: number | undefined;
      emitterUserId: string | null | undefined;
      diagnostics?: ProbableWaffleStateHashDiagnostics;
    },
    scene: ProbableWaffleScene
  ): void {
    const localPlayerNumber = scene.playerOrNull?.playerNumber ?? scene.player?.playerNumber ?? "unknown";
    const localContext = this.getLocalAuthorityContext(scene);
    const currentTick = getSceneService(scene, SimulationTickService)?.currentTick;
    const localSnapshot = this.localHashes.get(event.tick);
    if (localSnapshot === undefined) {
      if (typeof currentTick === "number" && event.tick > currentTick) {
        // Remote peer can occasionally report the next hash interval before this
        // client reaches the same tick. That's transport ordering, not desync.
        return;
      }

      // Peer hash arrived before our own was computed — shouldn't happen in lockstep
      // but guard it; the desync, if real, will be caught on the next interval.
      const knownTicks = [...this.localHashes.keys()].sort((left, right) => left - right);
      const earliestTick = knownTicks[0] ?? "none";
      const latestTick = knownTicks[knownTicks.length - 1] ?? "none";
      const currentTickLabel = currentTick ?? "unknown";
      const pauseReasons = getSceneService(scene, SimulationTickService)?.getPauseReasons().join(",") || "none";
      const signature = `${event.tick}|${event.playerNumber ?? "unknown"}|${earliestTick}|${latestTick}|${pauseReasons}|${currentTickLabel}`;
      if (this.missingLocalHashLogSignature !== signature) {
        this.missingLocalHashLogSignature = signature;
        this.logger.warn(
          `[DESYNC] Missing local hash for tick=${event.tick} (remotePlayer=${event.playerNumber ?? "unknown"} remoteHash=${event.hash}). ` +
            `Known local hash ticks range: ${earliestTick}..${latestTick}. localPlayer=${localPlayerNumber} ${localContext} ` +
            `currentTick=${currentTickLabel} pauses=${pauseReasons}. ` +
            `This usually means this client could not produce hash tick=${event.tick} yet (paused/stalled or just reset).`
        );
      }
      return;
    }
    this.missingLocalHashLogSignature = null;

    if (localSnapshot.hash === event.hash) {
      if (event.playerNumber !== undefined) {
        this.pendingCorrections.delete(event.playerNumber);
        const previousMismatchReason = this.activeMismatches.get(event.playerNumber);
        if (this.activeMismatches.delete(event.playerNumber)) {
          this.lastMismatchLogTickByPlayer.delete(event.playerNumber);
          this.logger.info(
            `[DESYNC] Player ${event.playerNumber} hash converged at tick ${event.tick}. ${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} previousReason=${previousMismatchReason ?? "unknown"}`
          );
          scene.events.emit(ProbableWaffleSceneEventName.DesyncStateChanged, {
            playerNumber: event.playerNumber,
            state: "resolved"
          });
        }
      }
      if (this.activeMismatches.size === 0) {
        this.clearDesyncIndicator();
      }
      return;
    }

    const mismatchReason = this.describeDiagnosticsMismatch(localSnapshot.diagnostics, event.diagnostics);
    const transientMovementDrift = this.isTransientMovementPositionDrift(mismatchReason);
    if (transientMovementDrift) {
      if (event.playerNumber !== undefined) {
        this.pendingCorrections.delete(event.playerNumber);
      }
      this.logger.info(
        `[DESYNC] Ignored transient movement position drift at tick=${event.tick}. ` +
          `${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ${transientMovementDrift}`
      );
      return;
    }
    const classifiedMismatch = this.classifyMismatchReason(mismatchReason);

    const isRemoteHost =
      event.emitterUserId !== undefined &&
      event.emitterUserId !== null &&
      event.emitterUserId === this.getKnownHostUserId(scene);
    const shouldHandleLocally = scene.isHost || isRemoteHost;
    if (!shouldHandleLocally) {
      return;
    }

    const diagnosticsDiff = this.collectDiagnosticsDiffs(localSnapshot.diagnostics, event.diagnostics);
    if (
      diagnosticsDiff.actorDiffs.length > 0 ||
      diagnosticsDiff.playerDiffs.length > 0 ||
      diagnosticsDiff.researchDiff
    ) {
      this.logger.warn(`[DESYNC][DIFF] tick=${event.tick} remotePlayer=${event.playerNumber ?? "unknown"}`, {
        authority: this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId),
        actorDiffCount: diagnosticsDiff.actorDiffs.length,
        playerDiffCount: diagnosticsDiff.playerDiffs.length,
        actorDiffs: diagnosticsDiff.actorDiffs,
        playerDiffs: diagnosticsDiff.playerDiffs,
        researchDiff: diagnosticsDiff.researchDiff ?? "none"
      });
    }
    if (classifiedMismatch) {
      this.logger.warn(
        `[DESYNC][CAUSE] tick=${event.tick} localPlayer=${localPlayerNumber} remotePlayer=${event.playerNumber ?? "unknown"} ${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ${classifiedMismatch}`
      );
    }
    scene.events.emit(ProbableWaffleSceneEventName.DesyncDiagnostics, {
      tick: event.tick,
      remotePlayerNumber: event.playerNumber,
      remoteUserId: event.emitterUserId ?? undefined,
      localHash: localSnapshot.hash,
      remoteHash: event.hash,
      mismatchReason,
      actorDiffs: diagnosticsDiff.actorDiffs,
      playerDiffs: diagnosticsDiff.playerDiffs,
      researchDiff: diagnosticsDiff.researchDiff
    } satisfies ProbableWaffleReplayDesyncDiagnostic);

    if (event.playerNumber !== undefined) {
      const previousMismatchReason = this.activeMismatches.get(event.playerNumber);
      const lastLoggedTick = this.lastMismatchLogTickByPlayer.get(event.playerNumber) ?? -Infinity;
      if (previousMismatchReason !== mismatchReason || event.tick - lastLoggedTick >= HASH_INTERVAL_TICKS) {
        this.logger.error(
          `[DESYNC] tick=${event.tick} localPlayer=${localPlayerNumber} remotePlayer=${event.playerNumber} ${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ` +
            `local=${localSnapshot.hash} remote=${event.hash} reason=${mismatchReason}`
        );
        this.lastMismatchLogTickByPlayer.set(event.playerNumber, event.tick);
      }
      this.activeMismatches.set(event.playerNumber, mismatchReason);
      scene.events.emit(ProbableWaffleSceneEventName.DesyncStateChanged, {
        playerNumber: event.playerNumber,
        state: "mismatch",
        reason: mismatchReason
      });
    } else {
      this.logger.error(
        `[DESYNC] tick=${event.tick} localPlayer=${localPlayerNumber} remotePlayer=${event.playerNumber} ${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ` +
          `local=${localSnapshot.hash} remote=${event.hash} reason=${mismatchReason}`
      );
    }
    this.showDesyncIndicator(event.tick, event.playerNumber, scene);

    if (!scene.isHost || !event.emitterUserId || event.playerNumber === undefined) {
      return;
    }

    this.handleHostDetectedDesync(event.tick, event.playerNumber, event.emitterUserId, mismatchReason, scene);
  }

  /**
   * Snapshot correction replaces authoritative state/tick baseline.
   * Clear hash caches so stale pre-correction hashes cannot trigger false mismatches.
   */
  private readonly onReconnectSnapshotApplied = (event: ReconnectSnapshotAppliedSceneEvent): void => {
    this.localHashes.clear();
    this.pendingCorrections.clear();
    this.activeMismatches.clear();
    this.lastMismatchLogTickByPlayer.clear();
    this.clearDesyncIndicator();
    this.logger.info(
      `[DESYNC] Hash baseline reset after snapshot apply. ${this.getLocalAuthorityContext(this.scene)} reason=${event.reason ?? "unknown"} tick=${event.tick ?? "unknown"}`
    );
  };

  /** Host-side escalation: send correction snapshot first, then alert room if mismatch persists past grace. */
  private handleHostDetectedDesync(
    tick: number,
    remotePlayerNumber: number,
    emitterUserId: string,
    reason: string,
    scene: ProbableWaffleScene
  ): void {
    const currentTick = getSceneService(scene, SimulationTickService)?.currentTick ?? tick;
    const existing = this.pendingCorrections.get(remotePlayerNumber);
    if (!existing) {
      getSceneService(scene, SnapshotService)?.sendSnapshot(scene, emitterUserId, "desync-correction");
      this.pendingCorrections.set(remotePlayerNumber, {
        emitterUserId,
        playerNumber: remotePlayerNumber,
        firstDetectedTick: currentTick,
        lastCorrectionTick: currentTick,
        correctionAttempts: 1,
        reason
      });
      this.logger.warn(
        `[DESYNC] Sent correction snapshot to player ${remotePlayerNumber} at tick ${tick}. ${this.getLocalAuthorityContext(scene)} reason=${reason}`
      );
      return;
    }

    if (reason) {
      existing.reason = reason;
    }

    if (currentTick - existing.lastCorrectionTick >= HASH_INTERVAL_TICKS) {
      getSceneService(scene, SnapshotService)?.sendSnapshot(scene, existing.emitterUserId, "desync-correction");
      existing.lastCorrectionTick = currentTick;
      existing.correctionAttempts += 1;
      this.logger.warn(
        `[DESYNC] Retried correction snapshot to player ${remotePlayerNumber} at tick ${tick}. ${this.getLocalAuthorityContext(scene)} attempts=${existing.correctionAttempts} reason=${existing.reason ?? "unknown"}`
      );
    }

    if (currentTick - existing.firstDetectedTick >= HASH_INTERVAL_TICKS * 6) {
      this.logger.error(
        `[DESYNC] Player ${remotePlayerNumber} is still divergent after ${existing.correctionAttempts} correction attempts. ` +
          `${this.getLocalAuthorityContext(scene)} Continuing automatic correction retries. reason=${existing.reason ?? "unknown"}`
      );
      existing.firstDetectedTick = currentTick;
    }
  }

  /**
   * Exhausted neutral resource nodes can legitimately be missing on one peer after
   * prior divergence and do not affect future deterministic simulation decisions.
   * Exclude them from hash to avoid permanent false desync loops.
   */
  private shouldIgnoreForStateHash(actor: Phaser.GameObjects.GameObject): boolean {
    const owner = getActorComponent(actor, OwnerComponent)?.getOwner();
    const isNeutral = owner === undefined || owner === -1;

    if (isNeutral) {
      const hasHealth = !!getActorComponent(actor, HealthComponent);
      const hasResourceSource = !!getActorComponent(actor, ResourceSourceComponent);
      // Neutral scenery actors (no health/resource state) are visual map props and should
      // not trigger desync correction loops when clients cull them differently.
      if (!hasHealth && !hasResourceSource) {
        return true;
      }
      // Neutral resources are map-owned economy sources. Hashing all idle sources causes
      // persistent correction loops when static map resources diverge by presence only.
      // Active harvesting still influences deterministic player-resource digests.
      if (hasResourceSource) {
        const resourceSource = getActorComponent(actor, ResourceSourceComponent);
        if (resourceSource && resourceSource.getAssignedGatherersCount() === 0) {
          return true;
        }
      }
    }

    if (!isNeutral) {
      return false;
    }
    const resourceSource = getActorComponent(actor, ResourceSourceComponent);
    if (!resourceSource) {
      return false;
    }
    return resourceSource.getCurrentResources() <= 0;
  }

  private getLocalAuthorityContext(scene: ProbableWaffleScene | undefined): string {
    if (!scene) {
      return "role=unknown isHost=unknown localPlayer=unknown";
    }
    const localPlayer = scene.playerOrNull?.playerNumber ?? scene.player?.playerNumber ?? "unknown";
    const role = scene.isHost ? "authoritative-host" : "non-host";
    const hostUserId = this.getKnownHostUserId(scene) ?? "unknown";
    return `role=${role} isHost=${scene.isHost} localPlayer=${localPlayer} hostUser=${hostUserId}`;
  }

  private getHashEventAuthorityContext(
    scene: ProbableWaffleScene,
    remotePlayerNumber: number | undefined,
    remoteUserId: string | null | undefined
  ): string {
    const hostUserId = this.getKnownHostUserId(scene);
    const remoteRole =
      remoteUserId && hostUserId
        ? remoteUserId === hostUserId
          ? "remote-authoritative-host"
          : "remote-non-host"
        : "remote-role-unknown";
    return `${this.getLocalAuthorityContext(scene)} remotePlayer=${remotePlayerNumber ?? "unknown"} remoteRole=${remoteRole}`;
  }

  private getKnownHostUserId(scene: ProbableWaffleScene): string | null {
    const metadataData = scene.baseGameData.gameInstance.gameInstanceMetadata.data;
    return metadataData.currentHostUserId ?? metadataData.createdBy ?? null;
  }

  /** Persistent on-screen overlay so the affected client immediately sees the desync. */
  private showDesyncIndicator(tick: number, remotePlayer: number | undefined, scene: Phaser.Scene): void {
    this.desyncText?.destroy();
    this.desyncText = scene.add
      .text(10, 10, `⚠ DESYNC tick:${tick} player:${remotePlayer ?? "?"}`, {
        color: "#ff4444",
        fontSize: "16px",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 4 }
      })
      .setDepth(9999)
      .setScrollFactor(0);
  }

  private clearDesyncIndicator(): void {
    this.desyncText?.destroy();
    this.desyncText = undefined;
  }

  /** Serializes production/research queues into deterministic textual digest segments. */
  private serializeActorQueueState(actor: { production?: any; research?: any }): string {
    const productionQueue = actor.production?.queue ?? [];
    const researchQueue = actor.research?.researches ?? [];
    const serializedProduction = productionQueue
      .map(
        (item: { name?: string; remainingTime?: number }) =>
          `${item.name ?? "?"}:${Math.round(item.remainingTime ?? 0)}`
      )
      .join(",");
    const serializedResearch = researchQueue
      .map(
        (item: { type?: string; remainingTime?: number }) =>
          `${item.type ?? "?"}:${Math.round(item.remainingTime ?? 0)}`
      )
      .join(",");
    return `${serializedProduction};${serializedResearch}`;
  }

  /** Serializes carrying/resource/container values that commonly diverge in economy bugs. */
  private serializeActorEconomyState(actor: {
    gatherer?: any;
    resourceSource?: any;
    resourceDrain?: any;
    container?: any;
  }): string {
    const gathered = `${actor.gatherer?.carriedResourceType ?? "none"}:${Math.round(actor.gatherer?.carriedResourceAmount ?? 0)}`;
    const source = Math.round(actor.resourceSource?.currentResources ?? -1);
    const drain = Math.round(actor.resourceDrain?.currentCapacity ?? -1);
    const container = (actor.container?.containedIds ?? []).slice().sort().join(",");
    return `${gathered}:${source}:${drain}:${container}`;
  }

  /** Serializes cooldown/runtime combat state that influences future command execution deterministically. */
  private serializeActorCombatState(actor: Phaser.GameObjects.GameObject): string {
    const attackCooldown = Math.round(getActorComponent(actor, AttackComponent)?.remainingCooldown ?? -1);
    const healingCooldown = Math.round(getActorComponent(actor, HealingComponent)?.remainingCooldown ?? -1);
    const builderCooldown = Math.round(getActorComponent(actor, BuilderComponent)?.remainingCooldown ?? -1);
    const gathererComponent = getActorComponent(actor, GathererComponent);
    const gathererCooldown = Math.round(gathererComponent?.remainingCooldown ?? -1);
    const gatherSourceId = gathererComponent?.currentResourceSource
      ? (getActorComponent(gathererComponent.currentResourceSource, IdComponent)?.id ?? "")
      : "";
    return `${attackCooldown}:${healingCooldown}:${builderCooldown}:${gathererCooldown}:${gatherSourceId}`;
  }

  /** Serializes AI blackboard order state so path/order drift appears in hash diagnostics. */
  private serializeActorOrderState(actor: Phaser.GameObjects.GameObject): string {
    const blackboard = getActorComponent(actor, PawnAiController)?.getData().blackboard;
    if (!blackboard) {
      return "";
    }

    // Hash stable order intent only. Full blackboard/runtime blobs contain transient
    // bookkeeping like status and failed-order history that can differ briefly after
    // correction without changing future gameplay decisions. Keeping the hash focused
    // on current/queued order intent makes desync reports point at actual sim drift.
    return this.stableSerialize({
      currentOrder: this.summarizeOrderForHash(blackboard.currentOrder),
      orderQueue: (blackboard.orderQueue ?? []).map((order: unknown) => this.summarizeOrderForHash(order)),
      queueLength: Array.isArray(blackboard.orderQueue) ? blackboard.orderQueue.length : 0
    });
  }

  /**
   * Reduce an order object to the deterministic intent that should affect future sim:
   * order type, stable actor target id, and logical tile target. Volatile runtime
   * references and bookkeeping fields are intentionally excluded from the hash.
   */
  private summarizeOrderForHash(order: unknown): unknown {
    if (!order || typeof order !== "object") {
      return order ?? null;
    }

    const orderRecord = order as Record<string, unknown>;
    const data = (orderRecord["data"] as Record<string, unknown> | undefined) ?? undefined;
    const targetTileLocation =
      data && typeof data["targetTileLocation"] === "object" && data["targetTileLocation"] !== null
        ? {
            x: Math.round(Number((data["targetTileLocation"] as Record<string, unknown>)["x"] ?? 0)),
            y: Math.round(Number((data["targetTileLocation"] as Record<string, unknown>)["y"] ?? 0)),
            z: Math.round(Number((data["targetTileLocation"] as Record<string, unknown>)["z"] ?? 0))
          }
        : undefined;

    return {
      orderType: orderRecord["orderType"] ?? null,
      data: {
        targetGameObjectId: data?.["targetGameObjectId"] ?? null,
        targetTileLocation
      }
    };
  }

  /** Deterministic serializer with stable object-key ordering to avoid hash noise from key order. */
  private stableSerialize(value: unknown): string {
    if (value === null) {
      return "null";
    }
    if (value === undefined) {
      return "undefined";
    }
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableSerialize(item)).join(",")}]`;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record)
        .sort()
        .map((key) => `${key}:${this.stableSerialize(record[key])}`)
        .join(",")}}`;
    }
    return String(value);
  }

  /** Produces a human-readable first-difference explanation between local and remote hash diagnostics. */
  private describeDiagnosticsMismatch(
    localDiagnostics: ProbableWaffleStateHashDiagnostics | undefined,
    remoteDiagnostics: ProbableWaffleStateHashDiagnostics | undefined
  ): string {
    if (!localDiagnostics && !remoteDiagnostics) {
      return "local and remote diagnostics unavailable";
    }
    if (!localDiagnostics) {
      return "local diagnostics unavailable";
    }
    if (!remoteDiagnostics) {
      return "remote diagnostics unavailable";
    }

    const localActorDigests = localDiagnostics.actorDigests ?? {};
    const remoteActorDigests = remoteDiagnostics.actorDigests ?? {};
    const actorIds = [...new Set([...Object.keys(localActorDigests), ...Object.keys(remoteActorDigests)])].sort();
    for (const actorId of actorIds) {
      const localDigest = localActorDigests[actorId];
      const remoteDigest = remoteActorDigests[actorId];
      if (localDigest !== remoteDigest) {
        return `actor=${actorId} local=${localDigest ?? "missing"} remote=${remoteDigest ?? "missing"}`;
      }
    }

    const localPlayerDigests = localDiagnostics.playerDigests ?? [];
    const remotePlayerDigests = remoteDiagnostics.playerDigests ?? [];
    const playerDigestCount = Math.max(localPlayerDigests.length, remotePlayerDigests.length);
    for (let index = 0; index < playerDigestCount; index++) {
      if (localPlayerDigests[index] !== remotePlayerDigests[index]) {
        return `player-state local=${localPlayerDigests[index] ?? "missing"} remote=${remotePlayerDigests[index] ?? "missing"}`;
      }
    }

    if ((localDiagnostics.researchDigest ?? "") !== (remoteDiagnostics.researchDigest ?? "")) {
      return `research local=${localDiagnostics.researchDigest ?? "missing"} remote=${remoteDiagnostics.researchDigest ?? "missing"}`;
    }

    return "hash mismatch without diagnostic delta";
  }

  /**
   * Converts raw mismatch text into an explicit short cause label to speed up diagnosis.
   */
  private classifyMismatchReason(reason: string): string | null {
    const actorMatch = /^actor=([^ ]+) local=(.+) remote=(.+)$/.exec(reason);
    if (actorMatch) {
      const actorId = actorMatch[1] ?? "unknown";
      const localDigest = actorMatch[2] ?? "missing";
      const remoteDigest = actorMatch[3] ?? "missing";
      if (remoteDigest === "missing") {
        return `cause=actor-missing actorId=${actorId} side=remote`;
      }
      if (localDigest === "missing") {
        return `cause=actor-missing actorId=${actorId} side=local`;
      }
      const parsed = this.extractActorPositionDelta(localDigest, remoteDigest);
      if (parsed && (parsed.dx !== 0 || parsed.dy !== 0 || parsed.dz !== 0)) {
        return `cause=actor-position-drift actorId=${actorId} local=(${parsed.localX},${parsed.localY},${parsed.localZ}) remote=(${parsed.remoteX},${parsed.remoteY},${parsed.remoteZ}) delta=(${parsed.dx},${parsed.dy},${parsed.dz})`;
      }
      return `cause=actor-state-drift actorId=${actorId}`;
    }
    if (reason.startsWith("player-state")) {
      const parsed = /^player-state local=(.+) remote=(.+)$/.exec(reason);
      if (parsed) {
        const detail = this.describePlayerStateDigestDelta(parsed[1] ?? "", parsed[2] ?? "");
        if (detail) {
          return `cause=player-state-drift ${detail}`;
        }
      }
      return "cause=player-state-drift";
    }
    if (reason.startsWith("research")) {
      return "cause=research-drift";
    }
    if (reason.includes("diagnostics unavailable")) {
      return "cause=diagnostics-unavailable";
    }
    return null;
  }

  /**
   * Parses actor digest tuples and returns logical position delta when available.
   * Digest format is generated in computeHashSnapshot().
   */
  private extractActorPositionDelta(
    localDigest: string,
    remoteDigest: string
  ): {
    localX: number;
    localY: number;
    localZ: number;
    remoteX: number;
    remoteY: number;
    remoteZ: number;
    dx: number;
    dy: number;
    dz: number;
  } | null {
    const localParts = localDigest.split(":");
    const remoteParts = remoteDigest.split(":");
    if (localParts.length < 7 || remoteParts.length < 7) {
      return null;
    }
    const localX = Number(localParts[4]);
    const localY = Number(localParts[5]);
    const localZ = Number(localParts[6]);
    const remoteX = Number(remoteParts[4]);
    const remoteY = Number(remoteParts[5]);
    const remoteZ = Number(remoteParts[6]);
    if (
      !Number.isFinite(localX) ||
      !Number.isFinite(localY) ||
      !Number.isFinite(localZ) ||
      !Number.isFinite(remoteX) ||
      !Number.isFinite(remoteY) ||
      !Number.isFinite(remoteZ)
    ) {
      return null;
    }
    return {
      localX,
      localY,
      localZ,
      remoteX,
      remoteY,
      remoteZ,
      dx: localX - remoteX,
      dy: localY - remoteY,
      dz: localZ - remoteZ
    };
  }

  /**
   * Movement tween progress can differ slightly across clients between sim ticks.
   * Ignore tiny actor position-only drift when both sides are executing the same move order.
   */
  private isTransientMovementPositionDrift(reason: string): string | null {
    const actorMatch = /^actor=([^ ]+) local=(.+) remote=(.+)$/.exec(reason);
    if (!actorMatch) {
      return null;
    }
    const actorId = actorMatch[1] ?? "unknown";
    const localDigest = actorMatch[2] ?? "";
    const remoteDigest = actorMatch[3] ?? "";
    if (!localDigest || !remoteDigest || localDigest === "missing" || remoteDigest === "missing") {
      return null;
    }

    const localParts = localDigest.split(":");
    const remoteParts = remoteDigest.split(":");
    if (localParts.length < 13 || remoteParts.length < 13) {
      return null;
    }

    // Compare everything except logical x/y/z (indices 4,5,6).
    for (let index = 0; index < Math.min(localParts.length, remoteParts.length); index++) {
      if (index >= 4 && index <= 6) {
        continue;
      }
      if ((localParts[index] ?? "") !== (remoteParts[index] ?? "")) {
        return null;
      }
    }

    const localX = Number(localParts[4]);
    const localY = Number(localParts[5]);
    const localZ = Number(localParts[6]);
    const remoteX = Number(remoteParts[4]);
    const remoteY = Number(remoteParts[5]);
    const remoteZ = Number(remoteParts[6]);
    if (
      !Number.isFinite(localX) ||
      !Number.isFinite(localY) ||
      !Number.isFinite(localZ) ||
      !Number.isFinite(remoteX) ||
      !Number.isFinite(remoteY) ||
      !Number.isFinite(remoteZ)
    ) {
      return null;
    }

    const dx = Math.abs(localX - remoteX);
    const dy = Math.abs(localY - remoteY);
    const dz = Math.abs(localZ - remoteZ);
    const smallDelta = dx <= 1 && dy <= 1 && dz <= 1;
    if (!smallDelta) {
      return null;
    }

    const moveOrderActive = localDigest.includes("orderType:Move") && remoteDigest.includes("orderType:Move");
    if (!moveOrderActive) {
      return null;
    }

    return `actorId=${actorId} delta=(${localX - remoteX},${localY - remoteY},${localZ - remoteZ})`;
  }

  private describePlayerStateDigestDelta(localDigest: string, remoteDigest: string): string | null {
    const local = this.parsePlayerStateDigest(localDigest);
    const remote = this.parsePlayerStateDigest(remoteDigest);
    if (!local || !remote) {
      return null;
    }
    const diffs: string[] = [];
    if (local.playerNumber !== remote.playerNumber) {
      diffs.push(`player=${local.playerNumber}->${remote.playerNumber}`);
    }
    if (local.minerals !== remote.minerals) {
      diffs.push(`minerals=${local.minerals}->${remote.minerals}`);
    }
    if (local.stone !== remote.stone) {
      diffs.push(`stone=${local.stone}->${remote.stone}`);
    }
    if (local.wood !== remote.wood) {
      diffs.push(`wood=${local.wood}->${remote.wood}`);
    }
    return diffs.length > 0 ? diffs.join(" ") : null;
  }

  private parsePlayerStateDigest(
    digest: string
  ): { playerNumber: number; minerals: number; stone: number; wood: number } | null {
    const parts = digest.split(":");
    if (parts.length < 4) {
      return null;
    }
    const parsed = parts.slice(0, 4).map((part) => Number(part));
    if (parsed.some((part) => !Number.isFinite(part))) {
      return null;
    }
    return {
      playerNumber: parsed[0] ?? -1,
      minerals: parsed[1] ?? 0,
      stone: parsed[2] ?? 0,
      wood: parsed[3] ?? 0
    };
  }

  /**
   * Produces structured state-diff snippets for deterministic debugging.
   * The output is capped so logs/replays stay readable even on large mismatches.
   */
  private collectDiagnosticsDiffs(
    localDiagnostics: ProbableWaffleStateHashDiagnostics | undefined,
    remoteDiagnostics: ProbableWaffleStateHashDiagnostics | undefined
  ): { actorDiffs: string[]; playerDiffs: string[]; researchDiff?: string } {
    if (!localDiagnostics || !remoteDiagnostics) {
      return {
        actorDiffs: [],
        playerDiffs: []
      };
    }

    const actorDiffs: string[] = [];
    const localActorDigests = localDiagnostics.actorDigests ?? {};
    const remoteActorDigests = remoteDiagnostics.actorDigests ?? {};
    const actorIds = [...new Set([...Object.keys(localActorDigests), ...Object.keys(remoteActorDigests)])].sort();
    for (const actorId of actorIds) {
      const localDigest = localActorDigests[actorId];
      const remoteDigest = remoteActorDigests[actorId];
      if (localDigest !== remoteDigest) {
        actorDiffs.push(`actor=${actorId} local=${localDigest ?? "missing"} remote=${remoteDigest ?? "missing"}`);
      }
    }

    const playerDiffs: string[] = [];
    const localPlayerDigests = localDiagnostics.playerDigests ?? [];
    const remotePlayerDigests = remoteDiagnostics.playerDigests ?? [];
    const playerDigestCount = Math.max(localPlayerDigests.length, remotePlayerDigests.length);
    for (let index = 0; index < playerDigestCount; index++) {
      if (localPlayerDigests[index] !== remotePlayerDigests[index]) {
        playerDiffs.push(
          `player-state local=${localPlayerDigests[index] ?? "missing"} remote=${remotePlayerDigests[index] ?? "missing"}`
        );
      }
    }

    const localResearch = localDiagnostics.researchDigest ?? "";
    const remoteResearch = remoteDiagnostics.researchDigest ?? "";
    const researchDiff =
      localResearch === remoteResearch
        ? undefined
        : `research local=${localResearch || "missing"} remote=${remoteResearch || "missing"}`;
    return {
      actorDiffs,
      playerDiffs,
      researchDiff
    };
  }

  /** Serializes per-player resource state used in deterministic economy progression. */
  private serializePlayerStates(scene: Phaser.Scene): string[] {
    const probableWaffleScene = scene as ProbableWaffleScene;
    return [...probableWaffleScene.players]
      .sort((a, b) => (a.playerNumber ?? 0) - (b.playerNumber ?? 0))
      .map((player) => {
        const playerNumber = player.playerNumber ?? -1;
        const resources = player.playerState.data.resources;
        return `${playerNumber}:${resources.minerals ?? 0}:${resources.stone ?? 0}:${resources.wood ?? 0}`;
      });
  }

  /** Serializes sorted per-player research ownership to detect technology progression drift. */
  private serializeResearchState(scene: Phaser.Scene): string[] {
    const playerResearch =
      (scene as ProbableWaffleScene).baseGameData.gameInstance.gameState?.data.playerResearch ?? {};
    return Object.entries(playerResearch)
      .sort(([left], [right]) => Number(left) - Number(right))
      .map(([playerNumber, researches]) => `${playerNumber}:${[...(researches ?? [])].sort().join(",")}`);
  }

  /** Drops old hash snapshots outside the rolling lookup window used for remote comparison. */
  private pruneOldHashes(currentTick: number): void {
    const cutoff = currentTick - HASH_STORE_TICKS;
    for (const tick of this.localHashes.keys()) {
      if (tick < cutoff) this.localHashes.delete(tick);
    }
  }

  /** Unsubscribes and clears all desync UI/state caches on scene shutdown. */
  destroy(): void {
    this.tickSub?.unsubscribe();
    this.hashReceivedSub?.unsubscribe();
    this.scene?.events.off(
      ProbableWaffleSceneEventName.ReconnectSnapshotApplied,
      this.onReconnectSnapshotApplied,
      this
    );
    this.scene = undefined;
    this.clearDesyncIndicator();
    this.pendingCorrections.clear();
    this.activeMismatches.clear();
    this.lastMismatchLogTickByPlayer.clear();
  }
}

/**
 * Fast non-cryptographic djb2 hash.
 * Deterministic and cheap — good enough for desync detection.
 */
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    // Bitwise OR keeps the value as a 32-bit integer throughout.
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h | 0;
  }
  // Convert to unsigned hex so the string is always non-negative.
  return (h >>> 0).toString(16);
}
