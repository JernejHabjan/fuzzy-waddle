import type { AiBrainState } from "../contracts/state/ai-state-contracts";
import type { AiObservation } from "../contracts/observation/ai-observation";
import type { AiIntentDecision } from "../contracts/commands/ai-intent";
import type { AiManagerProposal } from "../planning/coordination/ai-manager-proposal";
import { projectAiDebugSnapshot } from "./project-ai-debug-snapshot";
import { aiDebugFailureSnapshot } from "./ai-debug-failure-snapshot";
import { recordAiBoundaryFailure, recoverAiBoundary } from "../brain/arbitration/ai-optional-boundaries";

/** Optional diagnostics cannot discard a valid command result. Retries use the same saved cadence as proposers. */
export function projectAiDebugSafely(
  observation: AiObservation, state: AiBrainState, decisions: readonly AiIntentDecision[],
  batches: readonly AiManagerProposal[], cadence: number, project = projectAiDebugSnapshot
) {
  const owner = "debug_projection", incidents = state.scheduler.boundaryFaults ?? [];
  const previous = incidents.find((fault) => fault.owner === owner);
  if (previous?.recoveredTick === null && observation.tick < previous.retryAtTick)
    return { state, snapshot: aiDebugFailureSnapshot(observation, state) };
  try {
    const snapshot = project(observation, state, decisions, batches);
    const boundaryFaults = recoverAiBoundary(owner, observation.tick, incidents);
    return { state: { ...state, scheduler: { ...state.scheduler, boundaryFaults } }, snapshot };
  } catch (error) {
    const boundaryFaults = recordAiBoundaryFailure(owner, observation.tick, cadence, incidents, error);
    const next = { ...state, scheduler: { ...state.scheduler, boundaryFaults } } satisfies AiBrainState;
    return { state: next, snapshot: aiDebugFailureSnapshot(observation, next) };
  }
}
