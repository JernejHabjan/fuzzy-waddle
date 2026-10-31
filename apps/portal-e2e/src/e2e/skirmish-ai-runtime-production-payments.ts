// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import {
  normalizeRuntimeScopedQueuePayments,
  sameRuntimeQueueVector
} from "./skirmish-ai-runtime-scoped-queue-payments";
import { validateRuntimeQueueRefundPolicy } from "./skirmish-ai-runtime-refund-policy";

/** Validates scoped native cash intervals; per-tick progress remains a separate operation authority. */
export function normalizeRuntimeProductionPayments(
  capture: AiRuntimeProductionCaptureV1,
  commands: RuntimeProductionCausalityV1["commands"]
) {
  const failures: string[] = [];
  const gaps = new Set<string>();
  const queueFacts = capture.facts.filter((fact) => fact.kind === "queue_resource");
  const scoped = queueFacts.filter((fact) => {
    const value = fact.resource;
    if (value.originatingCommandContext?.execution.source !== "ai") return false;
    if (
      !commands.some(
        (entry) => entry.command.execution?.commandId === value.originatingCommandContext?.execution.commandId
      )
    ) {
      failures.push("production_ai_unattributed_payment");
      return false;
    }
    if (value.payment !== "immediate" && value.operation !== "cancellation_refund") {
      if (value.payment === "unknown") gaps.add("production_ai_payment_mode_unknown");
      else if (value.operation !== "tick_charge") {
        gaps.add("production_ai_per_tick_liability_missing");
      }
      return false;
    }
    if (value.emission.phase === "denied") {
      gaps.add("production_ai_denied_payment");
      return false;
    }
    return true;
  });
  const payments = normalizeRuntimeScopedQueuePayments(
    { ...capture, facts: scoped },
    commands.map((entry) => entry.command)
  );
  failures.push(...payments.failures);
  for (const payment of payments.payments) {
    const value = payment.resource;
    if (
      value.operation === "immediate_charge" &&
      !sameRuntimeQueueVector(value.storedPrice, value.emission.requested)
    ) {
      failures.push("production_ai_charge_stored_price_mismatch");
    }
    failures.push(...validateRuntimeQueueRefundPolicy(value));
  }
  return { queueFacts, payments, failures, gaps: [...gaps] };
}
