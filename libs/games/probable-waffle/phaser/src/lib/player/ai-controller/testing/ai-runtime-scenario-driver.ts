import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AIBehaviorTreeStateData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeScenarioBoundaryV1 } from "./ai-runtime-scenario-bridge";

/** Narrow bridge port keeps fixture orchestration testable while production uses the real-scene adapter. */
export interface AiRuntimeScenarioBridgePortV1 {
  advanceToCommittedObservation(playerNumber: PlayerNumber, targetTick: number): Promise<AiRuntimeScenarioBoundaryV1>;
  restoreControllerBoundary(playerNumber: PlayerNumber, state: AIBehaviorTreeStateData): void;
}

/** Runtime case recipe. Arrangement must use normal actor definitions and shared commands. */
export interface AiRuntimeScenarioRecipeV1 {
  readonly scenarioId: string;
  readonly playerNumber: PlayerNumber;
  readonly checkpointTicks: readonly number[];
  readonly saveContinuationAfterTick: number | null;
}

/** Drives authored runtime checkpoints and performs one save/restore continuation when requested. */
export async function runAiRuntimeScenarioV1(
  bridge: AiRuntimeScenarioBridgePortV1,
  recipe: AiRuntimeScenarioRecipeV1
): Promise<readonly AiRuntimeScenarioBoundaryV1[]> {
  const checkpoints = [...new Set(recipe.checkpointTicks)].sort((left, right) => left - right);
  if (!/^[A-Z]+-[0-9]{2}$/.test(recipe.scenarioId)) throw new Error("invalid_runtime_scenario_id");
  if (checkpoints.length === 0) throw new Error("runtime_scenario_has_no_checkpoints");
  if (checkpoints.some((tick) => !Number.isSafeInteger(tick) || tick < 0)) {
    throw new Error("invalid_runtime_scenario_checkpoint");
  }
  if (recipe.saveContinuationAfterTick !== null && !checkpoints.includes(recipe.saveContinuationAfterTick)) {
    throw new Error("runtime_save_checkpoint_missing");
  }
  const results: AiRuntimeScenarioBoundaryV1[] = [];
  for (const tick of checkpoints) {
    const boundary = await bridge.advanceToCommittedObservation(recipe.playerNumber, tick);
    results.push(boundary);
    if (recipe.saveContinuationAfterTick === tick) {
      bridge.restoreControllerBoundary(recipe.playerNumber, structuredClone(boundary.controllerState));
    }
  }
  return results;
}
