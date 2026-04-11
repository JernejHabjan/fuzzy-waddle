import type { Subscription } from "rxjs";
import { getSceneService } from "./scene-component-helpers";
import { SimulationTickService } from "./simulation-tick.service";
import { ActorIndexSystem } from "./ActorIndexSystem";
import { getActorComponent } from "../../data/actor-component";
import { IdComponent } from "../../entity/components/id-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { getCommunicator } from "../../data/scene-data";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";

/** Payload emitted on the allScenes EventEmitter when a hash mismatch is confirmed. */
export interface DesyncDetectedEvent {
  tick: number;
  /** Player number whose simulation state disagrees with ours. */
  remotePlayerNumber: number | undefined;
  localHash: string;
  remoteHash: string;
}

/**
 * Hash every 60 ticks = 3 seconds at 20 Hz.
 * Gives a wide enough window to absorb network jitter while catching desyncs quickly.
 */
const HASH_INTERVAL_TICKS = 60;

/**
 * Keep local hashes for this many ticks in case a peer message arrives slightly late.
 * In practice the peer hash arrives within 1–2 ticks of ours.
 */
const HASH_STORE_TICKS = 120;

/**
 * Computes a periodic deterministic hash of all actor states and exchanges it with
 * peers to detect simulation divergence. Only active in multiplayer — no-op in SP.
 *
 * Hash scope per actor: {id, health, logicalX, logicalY, owner}. Actors sorted by ID
 * so every client produces an identical string for the same simulation state.
 *
 * On mismatch: logs a structured error and shows a persistent on-screen indicator on
 * the desynced client. The recovery dialog is handled by Step 10 (DesyncRecoveryService).
 */
export class StateHashService {
  private readonly localHashes = new Map<number, string>();
  private tickSub?: Subscription;
  private hashReceivedSub?: Subscription;
  /** Lightweight debug overlay; shown immediately on mismatch for quick visual feedback. */
  private desyncText?: Phaser.GameObjects.Text;

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
      this.compareRemoteHash(event.tick, event.hash, event.playerNumber, scene);
    });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private onTick(tick: number, scene: ProbableWaffleScene): void {
    if (tick % HASH_INTERVAL_TICKS !== 0) return;

    const hash = this.computeHash(scene);
    this.localHashes.set(tick, hash);
    this.pruneOldHashes(tick);

    const communicator = getCommunicator(scene);
    const playerNumber = scene.playerOrNull?.playerNumber ?? null;
    if (playerNumber === null) return;

    communicator.stateHashChanged!.send({
      gameInstanceId: scene.gameInstanceId,
      emitterUserId: scene.userId ?? "",
      tick,
      playerNumber,
      hash
    });
  }

  /**
   * Build the hash string from all tracked actors sorted by their stable ID.
   * Uses integer positions (Math.round) to avoid float divergence from display rounding.
   */
  private computeHash(scene: Phaser.Scene): string {
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    if (!actorIndex) return "";

    const entries = actorIndex.getAllIdActors().map((go) => {
      const id = getActorComponent(go, IdComponent)?.id ?? "";
      const health = getActorComponent(go, HealthComponent)?.healthComponentData.health ?? -1;
      const pos = getGameObjectLogicalTransform(go);
      const lx = pos ? Math.round(pos.x) : 0;
      const ly = pos ? Math.round(pos.y) : 0;
      const owner = getActorComponent(go, OwnerComponent)?.getOwner() ?? -1;
      return `${id}:${Math.round(health)}:${lx}:${ly}:${owner}`;
    });

    // Sort by the ID prefix (first segment before ':') for deterministic ordering.
    entries.sort();
    return djb2(entries.join("|"));
  }

  private compareRemoteHash(
    tick: number,
    remoteHash: string,
    remotePlayerNumber: number | undefined,
    scene: ProbableWaffleScene
  ): void {
    const localHash = this.localHashes.get(tick);
    if (localHash === undefined) {
      // Peer hash arrived before our own was computed — shouldn't happen in lockstep
      // but guard it; the desync, if real, will be caught on the next interval.
      return;
    }

    if (localHash !== remoteHash) {
      console.error(
        `[DESYNC] tick=${tick} remotePlayer=${remotePlayerNumber} ` +
          `local=${localHash} remote=${remoteHash}`
      );
      // Small inline overlay for immediate visual feedback while grace period runs.
      this.showDesyncIndicator(tick, remotePlayerNumber, scene);
      // Notify the HUD so the recovery dialog can be triggered after the grace period.
      scene.communicator.allScenes.emit({
        name: "desync-detected",
        data: { tick, remotePlayerNumber, localHash, remoteHash } satisfies DesyncDetectedEvent
      });
    }
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

  private pruneOldHashes(currentTick: number): void {
    const cutoff = currentTick - HASH_STORE_TICKS;
    for (const tick of this.localHashes.keys()) {
      if (tick < cutoff) this.localHashes.delete(tick);
    }
  }

  destroy(): void {
    this.tickSub?.unsubscribe();
    this.hashReceivedSub?.unsubscribe();
    this.desyncText?.destroy();
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
