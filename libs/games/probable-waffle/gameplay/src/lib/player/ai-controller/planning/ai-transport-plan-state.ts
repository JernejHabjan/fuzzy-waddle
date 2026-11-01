import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainState, AiTransportState } from "../contracts/ai-brain-state";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";

export function hasAiTransportNonTerminalOutcome(state: AiBrainState, intentId: string): boolean {
  return state.pendingOutcomes.some(
    (outcome) =>
      outcome.identity.intentId === intentId &&
      (outcome.kind === "dispatched" || outcome.kind === "applied" || outcome.kind === "active")
  );
}

export function hasAiTransportFailedOutcome(state: AiBrainState, intentIds: readonly string[]): boolean {
  return state.pendingOutcomes.some(
    (outcome) =>
      intentIds.includes(outcome.identity.intentId) &&
      (outcome.kind === "rejected" || outcome.kind === "cancelled" || outcome.kind === "failed")
  );
}

export function withAiTransportPhase(
  plan: AiTransportPlanWithLifecycle,
  phase: AiTransportState["phase"],
  tick: number,
  duration: number,
  changes: Partial<NonNullable<AiTransportState["lifecycle"]>> = {}
): AiTransportPlanWithLifecycle {
  const lifecycle = plan.lifecycle;
  return {
    ...plan,
    phase,
    lifecycle: {
      ...lifecycle,
      ...changes,
      phaseDeadline: aiDeadline(tick + duration),
      lastProgressTick: tick,
      pendingIntentIds: []
    }
  };
}
