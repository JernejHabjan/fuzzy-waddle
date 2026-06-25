import type { Subscription } from "rxjs";
import { filter } from "rxjs";
import { getSceneService } from "../scene-component-helpers";
import { SimulationTickService } from "../simulation-tick.service";
import { ActorIndexSystem } from "../ActorIndexSystem";
import { ActorManager } from "../../../data/actor-manager";
import { getCommunicator } from "../../../data/scene-data";
import type {
  ActorDefinition,
  PlayerNumber,
  ProbableWafflePlayerStateData,
  ProbableWaffleSnapshotData,
  ProbableWaffleSnapshotResponseEvent,
  SelectionGroupData,
  UserId
} from "@fuzzy-waddle/api-interfaces";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { CancelableSimDelay } from "../simulation-time";
import { createMultiplayerClientLogger } from "../multiplayer/multiplayer-client-logger";

/** How often the host refreshes its stored snapshot (in milliseconds). */
const SNAPSHOT_REFRESH_INTERVAL_MS = 60_000;

/**
 * Manages full-simulation snapshots used for:
 *   - Reconnect catch-up
 *   - Late-join spectator catch-up
 *
 * Only the host captures snapshots. On receiving a `snapshot-request` event
 * the host serialises the current simulation state and sends it back via
 * `snapshot-response`.
 *
 * Serialisation delegates entirely to the existing `ActorManager.getActorDefinitionFromActor`
 * path — the same mechanism used by SaveGame/LoadGame — so no custom serialisation
 * code is needed per component.
 */
export class SnapshotService {
  private latestSnapshot: ProbableWaffleSnapshotData | null = null;
  private refreshHandle?: ReturnType<typeof setInterval>;
  private requestSub?: Subscription;
  private readonly logger = createMultiplayerClientLogger("SnapshotService");

  init(scene: ProbableWaffleScene): void {
    // Only the host generates and serves snapshots.
    if (!scene.isHost) {
      return;
    }

    const communicator = getCommunicator(scene);
    if (!communicator.snapshotRequested) {
      // Single-player — no snapshot exchange needed.
      return;
    }

    // Periodic refresh so the snapshot stays fresh for reconnecting players.
    this.refreshHandle = setInterval(() => {
      this.captureSnapshot(scene);
    }, SNAPSHOT_REFRESH_INTERVAL_MS);

    // Immediately take the first snapshot once the scene is running.
    // A small delay lets all actors finish spawning and registering.
    new CancelableSimDelay(scene, 500, () => {
      this.captureSnapshot(scene);
    });

    // Serve the latest snapshot to any client that requests one.
    this.requestSub = communicator.snapshotRequested.on
      .pipe(
        // Ignore own echo (host sent nothing, but guard it anyway).
        filter((e) => e.emitterUserId !== scene.userId)
      )
      .subscribe((e) => {
        if (!e.emitterUserId) {
          return;
        }
        this.sendSnapshot(
          scene,
          e.emitterUserId,
          e.reason === "desync-correction"
            ? "desync-correction"
            : e.reason === "spectator-catch-up"
              ? "spectator-catch-up"
              : "reconnect"
        );
      });

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  /** Returns the most recently captured snapshot, or null before the first capture. */
  getLatestSnapshot(): ProbableWaffleSnapshotData | null {
    return this.latestSnapshot;
  }

  /**
   * Serialise the full simulation state into a portable blob.
   * Does NOT mutate `gameState.data.actors` — it builds a fresh array.
   */
  captureSnapshot(scene: ProbableWaffleScene): void {
    const tick = getSceneService(scene, SimulationTickService)?.currentTick ?? 0;

    // --- Actors ---
    const actorIndex = getSceneService(scene, ActorIndexSystem);
    const actors: ActorDefinition[] = [];
    const allActors = actorIndex?.getAllIdActors() ?? [];
    for (const actor of allActors) {
      const def = ActorManager.getActorDefinitionFromActor(actor);
      if (def) {
        actors.push(def);
      }
    }

    // --- Player states ---
    // Deep-clone each player's state data so the snapshot is immutable.
    const playerStates: Record<PlayerNumber, ProbableWafflePlayerStateData> = {};
    const playerSelectionGroups: Record<PlayerNumber, SelectionGroupData[]> = {};
    for (const player of scene.players) {
      const num = player.playerNumber;
      if (num !== undefined) {
        playerStates[num] = structuredClone(player.playerState.data) as ProbableWafflePlayerStateData;
        playerSelectionGroups[num] = structuredClone(player.playerController.data.selectionGroups ?? []);
      }
    }

    // --- Research ---
    const rawResearch = scene.baseGameData.gameInstance.gameState?.data.playerResearch;
    const playerResearch = rawResearch ? structuredClone(rawResearch) : undefined;

    this.latestSnapshot = {
      tick,
      actors,
      playerStates,
      playerSelectionGroups,
      playerResearch
    } satisfies ProbableWaffleSnapshotData;
  }

  sendSnapshot(
    scene: ProbableWaffleScene,
    targetUserId: UserId,
    reason: "reconnect" | "spectator-catch-up" | "desync-correction"
  ): void {
    // Reconnect/spectator catch-up must reflect the host's current sim state, not the
    // last periodic checkpoint, otherwise recent commands would be lost on restore.
    this.captureSnapshot(scene);

    if (!this.latestSnapshot) {
      this.logger.warn("[SnapshotService] Could not build snapshot for requesting client.");
      return;
    }

    const communicator = getCommunicator(scene);
    communicator.snapshotResponse?.send({
      gameInstanceId: scene.gameInstanceId,
      emitterUserId: scene.userId,
      targetUserId,
      reason,
      snapshot: this.latestSnapshot
    } satisfies ProbableWaffleSnapshotResponseEvent);
  }

  destroy(): void {
    if (this.refreshHandle !== undefined) {
      clearInterval(this.refreshHandle);
      this.refreshHandle = undefined;
    }
    this.requestSub?.unsubscribe();
  }
}
