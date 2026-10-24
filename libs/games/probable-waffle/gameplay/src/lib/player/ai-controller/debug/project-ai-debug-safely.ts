import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiIntentDecisionV1 } from "../contracts/ai-intent-v1";
import type { AiManagerProposalV1 } from "../planning/ai-manager-proposal";
import { projectAiDebugSnapshot } from "./project-ai-debug-snapshot";
import { aiDebugFailureSnapshot } from "./ai-debug-failure-snapshot";
import { recordAiBoundaryFailure, recoverAiBoundary } from "../brain/ai-optional-boundaries";

/** Optional diagnostics cannot discard a valid command result. Retries use the same saved cadence as proposers. */
export function projectAiDebugSafely(
  observation: AiObservationV1, state: AiBrainStateV1, decisions: readonly AiIntentDecisionV1[],
  batches: readonly AiManagerProposalV1[], cadence: number, project = projectAiDebugSnapshot
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
    const next = { ...state, scheduler: { ...state.scheduler, boundaryFaults } } satisfies AiBrainStateV1;
    return { state: next, snapshot: aiDebugFailureSnapshot(observation, next) };
  }
}
