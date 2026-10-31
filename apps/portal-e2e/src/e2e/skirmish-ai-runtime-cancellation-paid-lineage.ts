import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionQueueMutationV1 } from "./skirmish-ai-runtime-production-queue-mutation";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Requires observed purchase payment or the complete actual per-tick progress chain since physical insertion. */
export function matchRuntimeCancellationPaidLineage(
  capture: AiRuntimeProductionCaptureV1,
  removal: RuntimeProductionQueueMutationV1,
  mutations: RuntimeProductionCausalityV1["queueMutations"],
  operations: RuntimeProductionCausalityV1["operations"]
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const item = removal.item;
  const insertions = mutations.filter(
    (entry) =>
      entry.operation === "enqueue" &&
      entry.item.itemId === item.itemId &&
      entry.originatingCommandId === removal.originatingCommandId &&
      entry.sequence < removal.boundarySequences[0]
  );
  const insertion = insertions[0];
  if (insertions.length > 1) failures.push("production_ai_cancel_purchase_reused");
  if (!insertion) return { sequences: null, failures, gaps: ["production_ai_cancel_purchase_insertion_missing"] };
  if (!isDeepStrictEqual({ ...insertion.item, remainingTimeMs: item.remainingTimeMs }, item)) {
    return { sequences: null, failures: ["production_ai_cancel_purchase_item_changed"], gaps };
  }
  if (item.payment === "immediate") {
    const paid = operations.filter(
      (entry) =>
        entry.kind === "immediate_charge" &&
        entry.itemId === item.itemId &&
        entry.originatingCommandId === removal.originatingCommandId &&
        entry.sequence < insertion.boundarySequences[0] &&
        sameRuntimeQueueVector(entry.charged, item.charge)
    );
    if (paid.length > 1) failures.push("production_ai_cancel_payment_reused");
    if (!paid.length) gaps.push("production_ai_cancel_purchase_payment_missing");
    const payment = paid[0];
    return { sequences: paid.length === 1 && payment && !failures.length ? [payment.sequence] : null, failures, gaps };
  }
  const progress = capture.facts.filter(
    (entry): entry is Extract<AiRuntimeProductionFactV1, { kind: "queue_progress" }> =>
      entry.kind === "queue_progress" &&
      entry.sequence > insertion.sequence &&
      entry.sequence < removal.boundarySequences[0] &&
      entry.progress.item?.itemId === item.itemId
  );
  let remaining = item.totalTimeMs;
  const sequences: number[] = [];
  for (const start of progress.filter((entry) => entry.progress.phase === "started")) {
    const ends = progress.filter(
      (entry) => entry.progress.attemptId === start.progress.attemptId && entry.progress.phase !== "started"
    );
    const end = ends[0];
    if (
      !start.progress.item ||
      !end?.progress.item ||
      ends.length !== 1 ||
      end.sequence <= start.sequence ||
      !isDeepStrictEqual({ ...item, remainingTimeMs: start.progress.item.remainingTimeMs }, start.progress.item) ||
      !isDeepStrictEqual({ ...item, remainingTimeMs: end.progress.item.remainingTimeMs }, end.progress.item)
    ) {
      failures.push("production_ai_cancel_paid_progress_invalid");
      continue;
    }
    if (start.progress.item.remainingTimeMs !== remaining) gaps.push("production_ai_cancel_paid_progress_missing");
    remaining = end.progress.item.remainingTimeMs;
    if (end.progress.phase !== "advanced") continue;
    const paid = operations.filter(
      (entry) =>
        entry.kind === "tick_charge" &&
        entry.itemId === item.itemId &&
        entry.originatingCommandId === removal.originatingCommandId &&
        entry.attemptId === start.progress.attemptId &&
        entry.sequence === end.sequence &&
        sameRuntimeQueueVector(entry.charged, item.charge)
    );
    const payment = paid[0];
    if (paid.length !== 1 || !payment) gaps.push("production_ai_cancel_paid_progress_missing");
    else sequences.push(payment.sequence);
  }
  if (!sequences.length) gaps.push("production_ai_cancel_purchase_payment_missing");
  if (remaining !== item.remainingTimeMs) gaps.push("production_ai_cancel_paid_progress_missing");
  return { sequences: failures.length || gaps.length ? null : sequences, failures, gaps };
}
