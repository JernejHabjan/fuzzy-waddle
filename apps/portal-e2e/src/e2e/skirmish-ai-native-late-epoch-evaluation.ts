import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import type { runNativeProfileTransfer } from "./skirmish-ai-native-profile-transfer";

/** Actual original command and persisted receipt are delivered in both orders after a real host epoch transition. */
export function nativeLateEpochReplayFailures(
  order: "command_then_receipt" | "receipt_then_command",
  proof: Awaited<ReturnType<typeof runNativeProfileTransfer>>["lateEpochReplay"]
) {
  if (!proof || proof.order !== order) return ["late_epoch_real_replay_order_missing"];
  const failures: string[] = [];
  const { retained, before, after } = proof;
  const original = retained.original, receipt = retained.originalReceipt;
  if (!original || original.source !== "ai" || !original.intentId || !original.effectId ||
      !receipt || receipt.commandId !== original.commandId || receipt.authorityEpoch !== original.authorityEpoch ||
      receipt.sequence !== original.sequence || !receipt.worldLinkIds.length || !["applied", "active"].includes(receipt.kind))
    failures.push("late_epoch_original_native_applied_identity_missing");
  if (retained.authorityEpoch + 1 !== before.authorityEpoch || before.authorityEpoch !== after.authorityEpoch ||
      before.processedWatermark !== after.processedWatermark || before.nextSequence !== after.nextSequence)
    failures.push("late_epoch_authority_or_sequence_fence_changed");
  if (retained.applications !== 1 || before.applications !== 1 || after.applications !== 1 ||
      digestCanonicalAiValue(retained.original) !== digestCanonicalAiValue(after.original) ||
      digestCanonicalAiValue(receipt) !== digestCanonicalAiValue(after.originalReceipt))
    failures.push("late_epoch_original_reapplied_or_identity_restamped");
  if (before.active !== after.active || !proof.beforeEffectDigest || proof.beforeEffectDigest !== proof.afterEffectDigest)
    failures.push("late_epoch_receipt_mutated_current_world_or_claims");
  for (const key of ["brainDigest", "cadenceDigest", "blackboardDigest", "incomeSamplingDigest",
    "observationMemoryDigest", "reconciliationDigest"] as const)
    if (proof.beforeContinuation[key] !== proof.afterContinuation[key])
      failures.push(`late_epoch_receipt_mutated_current_continuation:${key}`);
  if (!original || !after.outcomes.some((outcome) => outcome.commandId === original.commandId &&
      outcome.authorityEpoch === original.authorityEpoch && outcome.sequence === original.sequence &&
      outcome.kind === "rejected" && outcome.reason === "stale_authority_epoch"))
    failures.push("late_epoch_original_command_not_rejected_by_actual_fence");
  if ([retained, before, after].some((sample) => sample.failure !== null || sample.disposed))
    failures.push("late_epoch_capture_overflow_or_disposed");
  return failures;
}
