import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeQueueResourceV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-queue-resource-v1";

/** Mirrors the native stored-item policy; per-tick refunds use one stored vector, never cumulative paid charges. */
export function validateRuntimeQueueRefundPolicy(value: AiRuntimeQueueResourceV1): string[] {
  if (value.operation !== "cancellation_refund") return [];
  const { storedPrice, refundFactor, totalTimeMs, remainingTimeMs } = value;
  if (!storedPrice || refundFactor === null || !Number.isFinite(refundFactor) || refundFactor < 0 || refundFactor > 1 ||
    totalTimeMs === null || !Number.isFinite(totalTimeMs) || totalTimeMs <= 0 || remainingTimeMs === null ||
    !Number.isFinite(remainingTimeMs) || remainingTimeMs < 0 || remainingTimeMs > totalTimeMs ||
    value.payment === "unknown" || (value.payment === "per_successful_tick" && value.researchType !== null)) {
    return ["production_ai_refund_policy_invalid"];
  }
  // Native immediate production ignores progress. Research and pay-over-time production scale the stored vector.
  const progressFactor = value.researchType !== null || value.payment === "per_successful_tick"
    ? 1 - (totalTimeMs - remainingTimeMs) / totalTimeMs : 1;
  const expected = (type: ResourceType) => value.researchType !== null
    ? Math.floor((storedPrice[type] ?? 0) * (refundFactor * progressFactor))
    : Math.floor((storedPrice[type] ?? 0) * progressFactor * refundFactor);
  return Object.values(ResourceType).some((type) => (value.emission.requested?.[type] ?? 0) !== expected(type))
    ? ["production_ai_refund_progress_mismatch"] : [];
}
