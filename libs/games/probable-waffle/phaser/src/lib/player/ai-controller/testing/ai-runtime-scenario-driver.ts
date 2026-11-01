import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { AIBehaviorTreeStateData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeScenarioBoundary } from "./ai-runtime-scenario-bridge";

/** Narrow bridge port keeps fixture orchestration testable while production uses the real-scene adapter. */
export interface AiRuntimeScenarioBridgePort {
  advanceToCommittedObservation(playerNumber: PlayerNumber, targetTick: number): Promise<AiRuntimeScenarioBoundary>;
  restoreControllerBoundary(playerNumber: PlayerNumber, state: AIBehaviorTreeStateData): void;
}

/** Runtime case recipe. Arrangement must use normal actor definitions and shared commands. */
export interface AiRuntimeScenarioRecipe {
  readonly scenarioId: string;
  readonly playerNumber: PlayerNumber;
  readonly checkpointTicks: readonly number[];
  readonly saveContinuationAfterTick: number | null;
}

/** Drives authored runtime checkpoints and performs one save/restore continuation when requested. */
export async function runAiRuntimeScenario(
  bridge: AiRuntimeScenarioBridgePort,
  recipe: AiRuntimeScenarioRecipe
): Promise<readonly AiRuntimeScenarioBoundary[]> {
  const checkpoints = [...new Set(recipe.checkpointTicks)].sort((left, right) => left - right);
  if (!/^[A-Z]+-[0-9]{2}$/.test(recipe.scenarioId)) throw new Error("invalid_runtime_scenario_id");
  if (checkpoints.length === 0) throw new Error("runtime_scenario_has_no_checkpoints");
  if (checkpoints.some((tick) => !Number.isSafeInteger(tick) || tick < 0)) {
    throw new Error("invalid_runtime_scenario_checkpoint");
  }
  if (recipe.saveContinuationAfterTick !== null && !checkpoints.includes(recipe.saveContinuationAfterTick)) {
    throw new Error("runtime_save_checkpoint_missing");
  }
  const results: AiRuntimeScenarioBoundary[] = [];
  for (const tick of checkpoints) {
    const boundary = await bridge.advanceToCommittedObservation(recipe.playerNumber, tick);
    results.push(boundary);
    if (recipe.saveContinuationAfterTick === tick) {
      bridge.restoreControllerBoundary(recipe.playerNumber, structuredClone(boundary.controllerState));
    }
  }
  return results;
}
