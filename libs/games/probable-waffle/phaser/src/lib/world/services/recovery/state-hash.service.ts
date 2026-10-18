import Phaser from "phaser";
import type {
  ProbableWaffleReplayDesyncDiagnostic,
  ProbableWaffleStateHashDiagnostics
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { Subscription } from "rxjs";
import { getSceneService } from "../scene-component-helpers";
import { SimulationTickService } from "../simulation-tick.service";
import { getCommunicator } from "../../../data/scene-data";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { SnapshotService } from "./snapshot.service";
import type { ReconnectSnapshotAppliedSceneEvent } from "./probable-waffle-scene-events";
import { ProbableWaffleSceneEventName } from "./probable-waffle-scene-events";
import { createMultiplayerClientLogger } from "../multiplayer/multiplayer-client-logger";
import { digestAuthoritativeStateProjectionV1, type AuthoritativeStateProjectionV1 } from "./authoritative-state-projection";
import { StateHashProjection } from "./state-hash-projection";
import { StateHashDiagnostics } from "./state-hash-diagnostics";
import type { HashSnapshot } from "./hash-snapshot";
import type { PendingCorrection } from "./pending-hash-correction";

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
/** Documents the following declaration and its compatibility contract. */
const INCLUDE_HASH_DIAGNOSTICS_IN_STEADY_STATE = true;

/**
 * Computes a periodic deterministic hash of all actor states and exchanges it with
 * peers to detect simulation divergence. Only active in multiplayer — no-op in SP.
 *
 * Hash scope per actor: {id, health, tileX, tileY, owner}. Actors sorted by ID
 * so every client produces an identical string for the same simulation state.
 * Campaign scenes also append their canonical mission-runtime snapshot.
 * The service hashes once per HASH_INTERVAL_TICKS instead of every simulation tick:
 * full actor serialization is intentionally diagnostic-heavy, and per-tick hashing
 * would compete with lockstep command processing during large battles.
 *
 * On mismatch: logs a structured error and shows a persistent on-screen indicator on
 * the desynced client while automatic snapshot correction retries run.
 */
export class StateHashService {
  private readonly projection = new StateHashProjection();
  private readonly diagnostics = new StateHashDiagnostics();

  /** Shared projection used by peers, saves and native scenario assertions. */
  captureAuthoritativeProjection(scene: Phaser.Scene): AuthoritativeStateProjectionV1 {
    return this.projection.captureAuthoritativeProjection(scene);
  }

  private readonly logger = createMultiplayerClientLogger("StateHash");
  private readonly localHashes = new Map<number, HashSnapshot>();
  private tickSub?: Subscription;
  private hashReceivedSub?: Subscription;
  private scene?: ProbableWaffleScene;
  /** Documents the desync text member and its declared contract at this boundary. */
  private desyncText?: Phaser.GameObjects.Text;
  private readonly pendingCorrections = new Map<number, PendingCorrection>();
  /** Documents the following declaration and its compatibility contract. */
  private readonly activeMismatches = new Map<number, string>();
  /** Documents the following declaration and its compatibility contract. */
  private readonly lastMismatchLogTickByPlayer = new Map<number, number>();
  private missingLocalHashLogSignature: string | null = null;

  /** Documents the init member and its declared contract at this boundary. */
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

  /** Documents the on tick member and its declared contract at this boundary. */
  private onTick(tick: number, scene: ProbableWaffleScene): void {
    if (tick % HASH_INTERVAL_TICKS !== 0) return;

    // Hashing runs once per second at the default tick rate. This keeps steady-state
    // desync detection cheap; diagnostics are included only when configured or needed.
    const includeDiagnostics =
      INCLUDE_HASH_DIAGNOSTICS_IN_STEADY_STATE || this.activeMismatches.size > 0 || this.pendingCorrections.size > 0;
    const snapshot = this.computeHashSnapshot(scene, includeDiagnostics);
    this.localHashes.set(tick, snapshot);
    this.pruneOldHashes(tick);

    const communicator = getCommunicator(scene);
    const stateHashChanged = communicator.stateHashChanged;
    const playerNumber = scene.playerOrNull?.playerNumber ?? null;
    if (!stateHashChanged || playerNumber === null) return;

    stateHashChanged.send({
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
    const projection = this.captureAuthoritativeProjection(scene);
    const actorDigests = includeDiagnostics
      ? Object.fromEntries(projection.actors.map((actor) => [actor.actorId, actor.digest]))
      : undefined;
    return {
      hash: digestAuthoritativeStateProjectionV1(projection),
      diagnostics: includeDiagnostics
        ? {
            actorDigests: actorDigests ?? {},
            playerDigests: [...projection.players],
            researchDigest: projection.research.join("|"),
            campaignMissionDigest: projection.campaignMission,
            campaignMissionFamilyDigests: projection.campaignMissionFamilies,
            randomDigest: projection.random
          }
        : undefined
    };
  }

  /**
   * Compares a host/client hash at the same simulation tick and escalates only confirmed
   * divergence. It ignores stale/out-of-order reports, tracks mismatch evidence for the
   * diagnostic surface, and asks recovery for a snapshot rather than attempting a local
   * repair that could make lockstep state less trustworthy.
   */
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
      const signature = `${event.tick}|${event.playerNumber ?? "unknown"}|${earliestTick}|${latestTick}|` +
        `${pauseReasons}|${currentTickLabel}`;
      if (this.missingLocalHashLogSignature !== signature) {
        this.missingLocalHashLogSignature = signature;
        this.logger.warn(
          `[DESYNC] Missing local hash for tick=${event.tick} ` +
            `(remotePlayer=${event.playerNumber ?? "unknown"} remoteHash=${event.hash}). ` +
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
            `[DESYNC] Player ${event.playerNumber} hash converged at tick ${event.tick}. ` +
              `${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ` +
              `previousReason=${previousMismatchReason ?? "unknown"}`
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

    const mismatchReason = this.diagnostics.describeDiagnosticsMismatch(localSnapshot.diagnostics, event.diagnostics);
    const transientMovementDrift = this.diagnostics.isTransientMovementPositionDrift(mismatchReason);
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
    const classifiedMismatch = this.diagnostics.classifyMismatchReason(mismatchReason);

    const isRemoteHost =
      event.emitterUserId !== undefined &&
      event.emitterUserId !== null &&
      event.emitterUserId === this.getKnownHostUserId(scene);
    const shouldHandleLocally = scene.isHost || isRemoteHost;
    if (!shouldHandleLocally) {
      return;
    }

    const diagnosticsDiff = this.diagnostics.collectDiagnosticsDiffs(localSnapshot.diagnostics, event.diagnostics);
    if (
      diagnosticsDiff.actorDiffs.length > 0 ||
      diagnosticsDiff.playerDiffs.length > 0 ||
      diagnosticsDiff.researchDiff ||
      diagnosticsDiff.campaignMissionDiff ||
      diagnosticsDiff.campaignMissionFamilyDiff ||
      diagnosticsDiff.randomDiff
    ) {
      this.logger.warn(`[DESYNC][DIFF] tick=${event.tick} remotePlayer=${event.playerNumber ?? "unknown"}`, {
        authority: this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId),
        actorDiffCount: diagnosticsDiff.actorDiffs.length,
        playerDiffCount: diagnosticsDiff.playerDiffs.length,
        actorDiffs: diagnosticsDiff.actorDiffs,
        playerDiffs: diagnosticsDiff.playerDiffs,
        researchDiff: diagnosticsDiff.researchDiff ?? "none",
        campaignMissionDiff: diagnosticsDiff.campaignMissionDiff ?? "none",
        campaignMissionFamilyDiff: diagnosticsDiff.campaignMissionFamilyDiff ?? "none",
        randomDiff: diagnosticsDiff.randomDiff ?? "none"
      });
    }
    if (classifiedMismatch) {
      this.logger.warn(
        `[DESYNC][CAUSE] tick=${event.tick} localPlayer=${localPlayerNumber} remotePlayer=${event.playerNumber ?? "unknown"} ` +
          `${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ${classifiedMismatch}`
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
      researchDiff: diagnosticsDiff.researchDiff,
      campaignMissionDiff: diagnosticsDiff.campaignMissionDiff,
      campaignMissionFamilyDiff: diagnosticsDiff.campaignMissionFamilyDiff,
      randomDiff: diagnosticsDiff.randomDiff
    } satisfies ProbableWaffleReplayDesyncDiagnostic);

    if (event.playerNumber !== undefined) {
      const previousMismatchReason = this.activeMismatches.get(event.playerNumber);
      const lastLoggedTick = this.lastMismatchLogTickByPlayer.get(event.playerNumber) ?? -Infinity;
      if (previousMismatchReason !== mismatchReason || event.tick - lastLoggedTick >= HASH_INTERVAL_TICKS) {
        this.logger.error(
          `[DESYNC] tick=${event.tick} localPlayer=${localPlayerNumber} remotePlayer=${event.playerNumber} ` +
            `${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ` +
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
        `[DESYNC] tick=${event.tick} localPlayer=${localPlayerNumber} remotePlayer=${event.playerNumber} ` +
          `${this.getHashEventAuthorityContext(scene, event.playerNumber, event.emitterUserId)} ` +
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
      `[DESYNC] Hash baseline reset after snapshot apply. ${this.getLocalAuthorityContext(this.scene)} ` +
        `reason=${event.reason ?? "unknown"} tick=${event.tick ?? "unknown"}`
    );
  };

  /** Documents the handle host detected desync member and its declared contract at this boundary. */
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
        `[DESYNC] Sent correction snapshot to player ${remotePlayerNumber} at tick ${tick}. ` +
          `${this.getLocalAuthorityContext(scene)} reason=${reason}`
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
        `[DESYNC] Retried correction snapshot to player ${remotePlayerNumber} at tick ${tick}. ` +
          `${this.getLocalAuthorityContext(scene)} attempts=${existing.correctionAttempts} reason=${existing.reason ?? "unknown"}`
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

  /** Documents the show desync indicator member and its declared contract at this boundary. */
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

  /** Documents the prune old hashes member and its declared contract at this boundary. */
  private pruneOldHashes(currentTick: number): void {
    const cutoff = currentTick - HASH_STORE_TICKS;
    for (const tick of this.localHashes.keys()) {
      if (tick < cutoff) this.localHashes.delete(tick);
    }
  }

  /** Documents the destroy member and its declared contract at this boundary. */
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
