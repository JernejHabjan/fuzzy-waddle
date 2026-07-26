import type { CampaignRewardCommitResult } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";

/**
 * Defines the closed campaign reward summary status value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignRewardSummaryStatus = "earned" | "already-claimed" | "temporary" | "not-eligible";

/**
 * Defines the structured campaign reward summary entry contract for this module. Its declared surface makes
 * reward id, title text id, kind, status explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignRewardSummaryEntry {
  /**
   * stable reward id used by {@link CampaignRewardSummaryEntry} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly rewardId: string;
  /**
   * stable title text id used by {@link CampaignRewardSummaryEntry} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly titleTextId: string;
  /**
   * discriminator for {@link CampaignRewardSummaryEntry}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: MissionRewardBundle["rewards"][number]["kind"];
  /**
   * discriminator for {@link CampaignRewardSummaryEntry}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignRewardSummaryStatus;
}

/**
 * Defines the structured campaign reward summary projection contract for this module. Its declared surface
 * makes status, entries, warnings, rejection reason explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignRewardSummaryProjection {
  /**
   * discriminator for {@link CampaignRewardSummaryProjection}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignRewardCommitResult["status"];
  /**
   * collection owned by {@link CampaignRewardSummaryProjection}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly entries: readonly CampaignRewardSummaryEntry[];
  /**
   * collection value on {@link CampaignRewardSummaryProjection}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly warnings: readonly string[];
  /**
   * Optional string rejection reason carried by {@link CampaignRewardSummaryProjection}. Treat it according to
   * the owning contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly rejectionReason?: string;
}

/** Documents the project campaign reward summary member and its declared contract at this boundary. */
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
        reward.kind === "temporary-boost" || reward.kind === "temporary-resource" || reward.kind === "temporary-unit";
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
