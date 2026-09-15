import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainStateV1, AiTransportStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiTransportPlanWithLifecycle } from "./ai-transport-plan-lifecycle";

export function hasAiTransportNonTerminalOutcome(state: AiBrainStateV1, intentId: string): boolean {
  return state.pendingOutcomes.some(
    (outcome) =>
      outcome.identity.intentId === intentId &&
      (outcome.kind === "dispatched" || outcome.kind === "applied" || outcome.kind === "active")
  );
}

export function hasAiTransportFailedOutcome(state: AiBrainStateV1, intentIds: readonly string[]): boolean {
  return state.pendingOutcomes.some(
    (outcome) =>
      intentIds.includes(outcome.identity.intentId) &&
      (outcome.kind === "rejected" || outcome.kind === "cancelled" || outcome.kind === "failed")
  );
}

export function withAiTransportPhase(
  plan: AiTransportPlanWithLifecycle,
  phase: AiTransportStateV1["phase"],
  tick: number,
  duration: number,
  changes: Partial<NonNullable<AiTransportStateV1["lifecycle"]>> = {}
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
