import type { GameCommandExecution } from "@fuzzy-waddle/probable-waffle-protocol";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import type { readNativeRetentionBoundary } from "./skirmish-ai-native-retention-boundary";

/** The exact old identity must be absent from detailed retention, still owned, and rejected by the actual safe watermark. */
export function nativeRetentionFenceFailures(
  original: GameCommandExecution, before: Awaited<ReturnType<typeof readNativeRetentionBoundary>>,
  after: Awaited<ReturnType<typeof readNativeRetentionBoundary>>, directReplay = true
) {
  const failures: string[] = [];
  if (original.source !== "ai" || !original.effectId || !original.intentId || !original.commandId)
    failures.push("retention_original_native_ai_identity_missing");
  for (const boundary of [before, after]) {
    if (boundary.processedCount !== 2048 || boundary.detailedOriginalPresent || boundary.authorityEpoch !== original.authorityEpoch ||
        boundary.processedWatermark < original.sequence)
      failures.push("retention_real_eviction_or_safe_watermark_missing");
    if (!boundary.activeOriginal || digestCanonicalAiValue(boundary.activeExecution) !== digestCanonicalAiValue(original))
      failures.push("retention_unresolved_original_execution_lost_or_restamped");
  }
  if ((directReplay && !after.replayAttempted) || after.replayApplications !== 0 ||
      before.authorityGameplayDigest !== after.authorityGameplayDigest)
    failures.push("retention_replay_missing_reapplied_or_changed_authority");
  const rejection = after.rejection;
  if (!rejection || rejection.commandId !== original.commandId || rejection.authorityEpoch !== original.authorityEpoch ||
      rejection.sequence !== original.sequence || rejection.reason !== "duplicate_command" || rejection.detail !== "sequence_watermark")
    failures.push("retention_original_not_rejected_by_native_sequence_watermark");
  return [...new Set(failures)];
}
