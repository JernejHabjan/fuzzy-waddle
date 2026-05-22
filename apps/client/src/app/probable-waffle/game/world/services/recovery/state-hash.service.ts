import type { ProbableWaffleStateHashDiagnostics } from "@fuzzy-waddle/api-interfaces";
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
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { getCommunicator } from "../../../data/scene-data";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { SnapshotService } from "./snapshot.service";
import { ActorManager } from "../../../data/actor-manager";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";

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
const CORRECTION_GRACE_PERIOD_TICKS = 100;
/** Keep false in production-style play to avoid heavy hash payload fan-out. */
const INCLUDE_HASH_DIAGNOSTICS_IN_STEADY_STATE = false;

interface PendingCorrection {
  emitterUserId: string;
  playerNumber: number;
  firstDetectedTick: number;
  alertSent: boolean;
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
 * the desynced client. The recovery dialog is handled by Step 10 (DesyncRecoveryService).
 */
export class StateHashService {
  private readonly localHashes = new Map<number, HashSnapshot>();
  private tickSub?: Subscription;
  private hashReceivedSub?: Subscription;
  /** Lightweight debug overlay; shown immediately on mismatch for quick visual feedback. */
  private desyncText?: Phaser.GameObjects.Text;
  private readonly pendingCorrections = new Map<number, PendingCorrection>();
  /** Tracks current mismatch reason per remote player for log deduping and dialog auto-close signaling. */
  private readonly activeMismatches = new Map<number, string>();

  /** Subscribes to sim ticks and peer hash relay; disabled automatically in singleplayer. */
  init(scene: ProbableWaffleScene): void {
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

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Emits local hash snapshots on a fixed tick interval and retains a short comparison history. */
  private onTick(tick: number, scene: ProbableWaffleScene): void {
    if (tick % HASH_INTERVAL_TICKS !== 0) return;

    const snapshot = this.computeHashSnapshot(scene, INCLUDE_HASH_DIAGNOSTICS_IN_STEADY_STATE);
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
    const entries = actorIndex.getAllIdActors().map((go) => {
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
    const localSnapshot = this.localHashes.get(event.tick);
    if (localSnapshot === undefined) {
      // Peer hash arrived before our own was computed — shouldn't happen in lockstep
      // but guard it; the desync, if real, will be caught on the next interval.
      return;
    }

    if (localSnapshot.hash === event.hash) {
      if (event.playerNumber !== undefined) {
        this.pendingCorrections.delete(event.playerNumber);
        const hadMismatch = this.activeMismatches.delete(event.playerNumber);
        if (hadMismatch) {
          scene.events.emit("desync-state-changed", {
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

    const isRemoteHost =
      event.emitterUserId !== undefined &&
      event.emitterUserId !== null &&
      event.emitterUserId === scene.baseGameData.gameInstance.gameInstanceMetadata.data.currentHostUserId;
    const shouldHandleLocally = scene.isHost || isRemoteHost;
    if (!shouldHandleLocally) {
      return;
    }

    if (event.playerNumber !== undefined) {
      const previousMismatchReason = this.activeMismatches.get(event.playerNumber);
      if (previousMismatchReason !== mismatchReason) {
        console.error(
          `[DESYNC] tick=${event.tick} remotePlayer=${event.playerNumber} ` +
            `local=${localSnapshot.hash} remote=${event.hash} reason=${mismatchReason}`
        );
      }
      this.activeMismatches.set(event.playerNumber, mismatchReason);
      scene.events.emit("desync-state-changed", {
        playerNumber: event.playerNumber,
        state: "mismatch",
        reason: mismatchReason
      });
    } else {
      console.error(
        `[DESYNC] tick=${event.tick} remotePlayer=${event.playerNumber} ` +
          `local=${localSnapshot.hash} remote=${event.hash} reason=${mismatchReason}`
      );
    }
    this.showDesyncIndicator(event.tick, event.playerNumber, scene);

    if (!scene.isHost || !event.emitterUserId || event.playerNumber === undefined) {
      return;
    }

    this.handleHostDetectedDesync(event.tick, event.playerNumber, event.emitterUserId, mismatchReason, scene);
  }

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
        alertSent: false,
        reason
      });
      console.warn(
        `[DESYNC] Sent correction snapshot to player ${remotePlayerNumber} at tick ${tick}. reason=${reason}`
      );
      return;
    }

    if (reason) {
      existing.reason = reason;
    }

    if (existing.alertSent || currentTick - existing.firstDetectedTick < CORRECTION_GRACE_PERIOD_TICKS) {
      return;
    }

    getCommunicator(scene).desyncAlert?.send({
      gameInstanceId: scene.gameInstanceId,
      emitterUserId: scene.userId,
      tick,
      desyncedPlayerNumber: remotePlayerNumber,
      reason: existing.reason
    });
    existing.alertSent = true;
    console.error(
      `[DESYNC] Player ${remotePlayerNumber} remained divergent after correction; opening recovery dialog. reason=${existing.reason ?? "unknown"}`
    );
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

    return this.stableSerialize({
      status: blackboard.status,
      currentOrder: blackboard.currentOrder,
      orderQueue: blackboard.orderQueue,
      failedOrders: blackboard.failedOrders
    });
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

  /** Serializes per-player resource/housing state used in deterministic economy progression. */
  private serializePlayerStates(scene: Phaser.Scene): string[] {
    const probableWaffleScene = scene as ProbableWaffleScene;
    return [...probableWaffleScene.players]
      .sort((a, b) => (a.playerNumber ?? 0) - (b.playerNumber ?? 0))
      .map((player) => {
        const playerNumber = player.playerNumber ?? -1;
        const resources = player.playerState.data.resources;
        const housing = player.playerState.data.housing;
        return `${playerNumber}:${resources.minerals ?? 0}:${resources.stone ?? 0}:${resources.wood ?? 0}:${housing.currentHousing}:${housing.maxHousing}`;
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
    this.clearDesyncIndicator();
    this.pendingCorrections.clear();
    this.activeMismatches.clear();
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
