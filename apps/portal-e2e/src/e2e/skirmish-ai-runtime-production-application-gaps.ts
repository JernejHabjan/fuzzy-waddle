import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";

/** Names missing physical/payment authority for admitted queue effects without synthesizing money or insertions. */
export function runtimeProductionApplicationGaps(
  capture: AiRuntimeProductionCaptureV1, commands: RuntimeProductionCausalityV1["commands"],
  payments: RuntimeProductionCausalityV1["payments"], mutations: RuntimeProductionCausalityV1["queueMutations"]
): string[] {
  const gaps = new Set<string>();
  for (const entry of commands) {
    const id = entry.command.execution?.commandId;
    const purchasing = entry.command.type === "PRODUCTION" || entry.command.type === "RESEARCH";
    const applied = entry.outcomes.some((fact) => fact.outcome.kind === "applied");
    const cancelled = entry.outcomes.some((fact) => fact.outcome.kind === "cancelled");
    const physicalPerTick = capture.facts.some((fact) => fact.kind === "queue_changed" &&
      fact.queue.lanes.some((lane) => lane.items.some((item) => item.commandId === id &&
        item.payment === "per_successful_tick" && item.identitySource === "command")));
    if (purchasing && applied && !physicalPerTick && !payments.some((payment) =>
      payment.resource.operation === "immediate_charge" &&
      payment.resource.originatingCommandContext?.execution.commandId === id)) {
      gaps.add("production_ai_applied_payment_missing");
    }
    const enqueued = mutations.some((mutation) => mutation.operation === "enqueue" && mutation.originatingCommandId === id);
    if (purchasing && applied && !enqueued) gaps.add("production_ai_enqueue_mutation_authority_missing");
    if (purchasing && applied && physicalPerTick && !enqueued) gaps.add("production_ai_per_tick_enqueue_authority_missing");
    if (!purchasing && cancelled && !payments.some((payment) =>
      payment.resource.operation === "cancellation_refund" && payment.resource.cancellationCommand?.execution?.commandId === id)) {
      gaps.add("production_ai_cancel_refund_missing");
    }
  }
  return [...gaps];
}
