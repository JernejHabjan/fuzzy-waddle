import type { ProbableWafflePlayer } from "@fuzzy-waddle/probable-waffle-protocol";
import { isSceneActive } from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import type { PlayerAiBlackboard } from "./player-ai-blackboard";
import { WorldStateSnapshotManager } from "./ai-behavior/world-state-snapshot-manager";
import { EconomyManager } from "./ai-behavior/economy-manager";
import { AiObservationPipeline } from "./observation/ai-observation-pipeline";

/** Owns fair observation and confirmed income sampling. It has no player-command authority. */
export class PlayerAiControllerAgent {
  private readonly worldStateSnapshotManager: WorldStateSnapshotManager;
  private readonly economyManager: EconomyManager;
  private readonly observationPipeline: AiObservationPipeline;
  private disposed = false;

  constructor(
    scene: ProbableWaffleScene,
    private readonly player: ProbableWafflePlayer,
    blackboard: PlayerAiBlackboard
  ) {
    if (player.playerNumber === undefined) throw new Error("ai_player_identity_unavailable");
    this.scene = scene;
    this.worldStateSnapshotManager = new WorldStateSnapshotManager(scene, player, blackboard);
    this.economyManager = new EconomyManager(blackboard, scene, player.playerNumber);
    this.observationPipeline = new AiObservationPipeline(scene, player, (resourceType) =>
      Math.max(0, (blackboard.economy.incomeSmoothed[resourceType] ?? 0) * 60)
    );
  }

  private readonly scene: ProbableWaffleScene;

  /** Captures a fresh input without yielding the simulation boundary; retained snapshots fail closed. */
  preparePureDecision(now: number): void {
    if (this.disposed) throw new Error("ai_controller_disposed");
    const tick = getSceneService(this.scene, SimulationTickService)?.currentTick ?? Math.max(0, Math.floor(now / 50));
    const previous = this.observationPipeline.getObservation();
    this.worldStateSnapshotManager.updateOwned(now);
    this.economyManager.update(now);
    const observation = this.observationPipeline.refreshNow(tick);
    if (!observation || observation === previous || observation.tick !== tick) {
      const debug = this.observationPipeline.getDebugSnapshot();
      const reason = debug.lastCommitError
        ? `capture_failed:${this.observationPipeline.getLastCommitErrorStage() ?? "unknown_stage"}:${this.observationPipeline.getLastCommitErrorCode() ?? "unknown_error"}`
        : !observation
          ? "no_observation"
          : observation.tick !== tick
            ? "committed_tick_mismatch"
            : observation === previous && this.player.playerNumber === undefined
              ? "player_identity_unavailable"
              : observation === previous && !this.player.factionType
                ? "player_faction_unavailable"
                : observation === previous && !isSceneActive(this.scene)
                  ? "scene_inactive"
                  : "snapshot_reused";
      throw new Error(`ai_current_decision_observation_unavailable:${reason}`);
    }
  }

  /** Returns the last atomically committed fair observation for pure decision selection. */
  getCommittedObservation() {
    return this.observationPipeline.getObservation();
  }

  /** Returns the runtime-derived capability catalog paired with the committed observation generation. */
  getCommittedCapabilityCatalog() {
    return this.observationPipeline.getCapabilityCatalog();
  }

  /** Saves only player-permitted memory and bounded query cursors, never live actors. */
  getObservationMemoryState() {
    return this.observationPipeline.getState();
  }

  /** Restores fair memory before the next observation rebuilds current live references. */
  setObservationMemoryState(state: Parameters<AiObservationPipeline["setState"]>[0]): void {
    this.observationPipeline.setState(state);
  }

  /** Preserve confirmed sampling in new saves; legacy stockpile estimates still restart safely. */
  restoreDeliveredIncomeSampling(state: Parameters<EconomyManager["setState"]>[0], restoredNow?: number): void {
    this.economyManager.setState(state, restoredNow);
  }

  getDeliveredIncomeSamplingState() {
    return this.economyManager.getState();
  }

  /** Supplies the debug panel with already committed observation metadata only. */
  getObservationDebugSnapshot() {
    return this.observationPipeline.getDebugSnapshot();
  }

  /** Controller shutdown owns sampler cleanup; repeated scene shutdown/destroy is harmless. */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.economyManager.destroy();
  }
}
