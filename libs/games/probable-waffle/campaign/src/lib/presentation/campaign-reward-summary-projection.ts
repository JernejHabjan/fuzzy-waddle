import type { CampaignRewardCommitResult } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";

export type CampaignRewardSummaryStatus = "earned" | "already-claimed" | "temporary" | "not-eligible";

export interface CampaignRewardSummaryEntry {
  readonly rewardId: string;
  readonly titleTextId: string;
  readonly kind: MissionRewardBundle["rewards"][number]["kind"];
  readonly status: CampaignRewardSummaryStatus;
}

export interface CampaignRewardSummaryProjection {
  readonly status: CampaignRewardCommitResult["status"];
  readonly entries: readonly CampaignRewardSummaryEntry[];
  readonly warnings: readonly string[];
  readonly rejectionReason?: string;
}

/** Converts a commit result into a stable UI model without exposing undiscovered hidden rewards. */
export function projectCampaignRewardSummary(
  bundle: MissionRewardBundle,
  result: CampaignRewardCommitResult
): CampaignRewardSummaryProjection {
  const applied = new Set(result.appliedRewardIds);
  const skipped = new Set(result.skippedRewardIds);
  const entries = bundle.rewards
    .filter((reward) => !reward.hidden || applied.has(reward.id) || skipped.has(reward.id))
    .filter((reward) => applied.has(reward.id) || skipped.has(reward.id))
    .map((reward): CampaignRewardSummaryEntry => {
      const temporary =
        reward.kind === "temporary-boost" ||
        reward.kind === "temporary-resource" ||
        reward.kind === "temporary-unit";
      return {
        rewardId: reward.id,
        titleTextId: reward.titleTextId,
        kind: reward.kind,
        status: applied.has(reward.id)
          ? temporary
            ? "temporary"
            : "earned"
          : reward.oneTime && result.status !== "rejected"
            ? "already-claimed"
            : "not-eligible"
      };
    })
    .sort((left, right) => left.rewardId.localeCompare(right.rewardId));
  return {
    status: result.status,
    entries,
    warnings: [...result.warnings],
    ...(result.rejectionReason ? { rejectionReason: result.rejectionReason } : {})
  };
}
