import {
  CampaignMissionOutcome,
  type CampaignProgressionProfile,
  type CampaignRewardCommitResult,
  type CampaignVictoryCommitRequest,
  type FactionType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionRewardBundle, MissionRewardDefinition } from "../contracts/mission-reward-bundle";
import type { CampaignProgressionRegistry } from "../registry/campaign-progression-registry";

/**
 * Defines the closed campaign profile revision policy value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignProfileRevisionPolicy = "reject" | "merge";

/**
 * Pure reward transaction resolver used before the server persists a victory. It checks
 * mission/profile revision policy, applies only registered permanent rewards, and
 * derives an idempotency key from the profile/run so replayed requests return the same
 * result instead of duplicating unlocks or currency.
 *
 * ```text
 * eligible victory + base profile -> resolve rewards -> commit request/result
 *                                              |                 |
 *                                      temporary allowance --X    +-> SQL transaction
 * ```
 */
export class CampaignRewardCommitService {
  private readonly committedResults = new Map<string, CampaignRewardCommitResult>();

  constructor(
    private readonly registry: CampaignProgressionRegistry,
    private readonly revisionPolicy: CampaignProfileRevisionPolicy = "reject"
  ) {}

  /**
   * Resolves one victory request as an idempotent profile transaction.
   * It rejects stale profile revisions according to policy, reuses an earlier result for the same run, and returns the exact persisted delta that the server must commit atomically.
   */
  commit(
    profileKey: string,
    profile: CampaignProgressionProfile,
    request: CampaignVictoryCommitRequest,
    bundle: MissionRewardBundle
  ): CampaignRewardCommitResult {
    const idempotencyKey = `${profileKey}:${request.runId}`;
    const previous = this.committedResults.get(idempotencyKey);
    if (previous) return { ...previous, status: "already-committed" };
    const rejectionReason = this.rejectionReason(profile, request, bundle);
    if (rejectionReason) return rejectedResult(profile, request, rejectionReason);

    const rewardsById = new Map(bundle.rewards.map((reward) => [String(reward.id), reward]));
    const completedObjectiveIds = new Set(request.completedObjectiveIds);
    let next = cloneProfile(profile);
    const appliedRewardIds: string[] = [];
    const skippedRewardIds: string[] = [];
    const warnings: string[] = [];
    for (const rewardId of uniqueSorted(request.discoveredRewardIds)) {
      const reward = rewardsById.get(rewardId);
      if (!reward) {
        skippedRewardIds.push(rewardId);
        warnings.push(`Reward '${rewardId}' is no longer registered; existing claim history was preserved`);
        continue;
      }
      if ((reward.objectiveIds ?? []).some((objectiveId) => !completedObjectiveIds.has(String(objectiveId)))) {
        skippedRewardIds.push(rewardId);
        warnings.push(`Reward '${rewardId}' is not eligible for the completed objectives`);
        continue;
      }
      const registrationError = rewardRegistrationError(reward, this.registry);
      if (registrationError) {
        skippedRewardIds.push(rewardId);
        warnings.push(registrationError);
        continue;
      }
      const claimId = rewardClaimId(bundle, reward);
      const permanent = !isTemporaryReward(reward);
      if (permanent && reward.oneTime && next.rewardClaimIds.includes(claimId)) {
        skippedRewardIds.push(rewardId);
        continue;
      }
      next = applyReward(next, request.runId, reward, this.registry);
      if (permanent && reward.oneTime) {
        next = { ...next, rewardClaimIds: uniqueSorted([...next.rewardClaimIds, claimId]) };
      }
      appliedRewardIds.push(rewardId);
    }
    next = { ...next, revision: profile.revision + 1 };
    const result: CampaignRewardCommitResult = {
      runId: request.runId,
      status: "committed",
      profile: next,
      appliedRewardIds,
      skippedRewardIds,
      warnings
    };
    this.committedResults.set(idempotencyKey, result);
    return result;
  }

  private rejectionReason(
    profile: CampaignProgressionProfile,
    request: CampaignVictoryCommitRequest,
    bundle: MissionRewardBundle
  ): string | undefined {
    if (request.outcome !== CampaignMissionOutcome.Victory) return "Only eligible victories can commit rewards";
    if (request.replayPlayback) return "Replay playback cannot commit rewards";
    if (!request.integrity.eligibleForRewards) return "Run integrity was invalidated";
    if (request.missionId !== bundle.missionId) return "Reward bundle does not match the completed mission";
    if (this.revisionPolicy === "reject" && request.baseProfileRevision !== profile.revision) {
      return `Profile revision changed from ${request.baseProfileRevision} to ${profile.revision}`;
    }
    return undefined;
  }
}

/**
 * Applies one authored reward to an isolated profile copy.
 * It enforces registration and repeatability rules, records claim identity, and keeps temporary/invalid rewards from silently changing persistent progression.
 */
function applyReward(
  profile: CampaignProgressionProfile,
  runId: string,
  reward: MissionRewardDefinition,
  registry: CampaignProgressionRegistry
): CampaignProgressionProfile {
  switch (reward.kind) {
    case "currency":
      if (!registry.getCurrency(reward.currencyId)) return profile;
      return {
        ...profile,
        wallet: {
          balances: {
            ...profile.wallet.balances,
            [reward.currencyId]: (profile.wallet.balances[reward.currencyId] ?? 0) + reward.amount
          }
        }
      };
    case "story-unlock": {
      const unlocked = applyUnlock(
        profile,
        reward.unlockId,
        reward.scope.kind === "faction" ? reward.scope.faction : undefined
      );
      if (reward.scope.kind !== "actor") return unlocked;
      const objectName = reward.scope.objectName;
      const hero = registry.heroDefinitions().find((candidate) => candidate.actorName === objectName);
      if (!hero) return unlocked;
      const current = unlocked.heroProgress[hero.id] ?? { upgradeIds: [], storySkillUnlockIds: [] };
      return {
        ...unlocked,
        heroProgress: {
          ...unlocked.heroProgress,
          [hero.id]: {
            ...current,
            storySkillUnlockIds: uniqueSorted([...current.storySkillUnlockIds, reward.unlockId])
          }
        }
      };
    }
    case "faction-unlock":
    case "unit-unlock":
    case "building-unlock":
    case "technology-unlock":
      return applyUnlock(profile, reward.unlockId, reward.scope.kind === "faction" ? reward.scope.faction : undefined);
    case "stat-tome": {
      const upgrade = registry.getUpgrade(reward.upgradeId);
      if (!upgrade) return profile;
      const withUpgrade = {
        ...profile,
        discoveredUpgradeIds: uniqueSorted([...profile.discoveredUpgradeIds, reward.upgradeId]),
        permanentUpgradeIds: uniqueSorted([...profile.permanentUpgradeIds, reward.upgradeId])
      };
      if (upgrade.scope.kind === "hero") {
        const current = withUpgrade.heroProgress[upgrade.scope.heroId] ?? { upgradeIds: [], storySkillUnlockIds: [] };
        return {
          ...withUpgrade,
          heroProgress: {
            ...withUpgrade.heroProgress,
            [upgrade.scope.heroId]: {
              ...current,
              upgradeIds: uniqueSorted([...current.upgradeIds, reward.upgradeId])
            }
          }
        };
      }
      if (upgrade.scope.kind === "faction") {
        const current = withUpgrade.factionProgress[upgrade.scope.faction] ?? { upgradeIds: [] };
        return {
          ...withUpgrade,
          factionProgress: {
            ...withUpgrade.factionProgress,
            [upgrade.scope.faction]: { upgradeIds: uniqueSorted([...current.upgradeIds, reward.upgradeId]) }
          }
        };
      }
      return withUpgrade;
    }
    case "item": {
      const itemId = `${runId}:${reward.id}`;
      const current = profile.inventory.find((item) => item.id === itemId);
      const inventory = current
        ? profile.inventory.map((item) =>
            item.id === itemId ? { ...item, quantity: item.quantity + reward.quantity } : item
          )
        : [
            ...profile.inventory,
            {
              id: itemId,
              definitionId: reward.itemDefinitionId,
              quantity: reward.quantity,
              consumable: reward.consumable
            }
          ];
      return { ...profile, inventory: [...inventory].sort((left, right) => left.id.localeCompare(right.id)) };
    }
    case "temporary-boost":
    case "temporary-resource":
    case "temporary-unit":
      return profile;
  }
}

function applyUnlock(
  profile: CampaignProgressionProfile,
  unlockId: string,
  faction: FactionType | undefined
): CampaignProgressionProfile {
  const next = { ...profile, unlockIds: uniqueSorted([...profile.unlockIds, unlockId]) };
  if (faction === undefined) return next;
  const current = next.factionProgress[faction] ?? { upgradeIds: [] };
  return { ...next, factionProgress: { ...next.factionProgress, [faction]: current } };
}

function rewardClaimId(bundle: MissionRewardBundle, reward: MissionRewardDefinition): string {
  return `${bundle.missionId}:${reward.id}`;
}

function isTemporaryReward(reward: MissionRewardDefinition): boolean {
  return reward.kind === "temporary-boost" || reward.kind === "temporary-resource" || reward.kind === "temporary-unit";
}

function rewardRegistrationError(
  reward: MissionRewardDefinition,
  registry: CampaignProgressionRegistry
): string | undefined {
  switch (reward.kind) {
    case "currency":
      return registry.getCurrency(reward.currencyId) ? undefined : `Reward '${reward.id}' uses unknown currency`;
    case "story-unlock":
    case "faction-unlock":
    case "unit-unlock":
    case "building-unlock":
    case "technology-unlock":
      return registry.getUnlock(reward.unlockId) ? undefined : `Reward '${reward.id}' uses unknown unlock`;
    case "stat-tome":
      return registry.getUpgrade(reward.upgradeId) ? undefined : `Reward '${reward.id}' uses unknown upgrade`;
    case "item":
      return registry.getItem(reward.itemDefinitionId) ? undefined : `Reward '${reward.id}' uses unknown item`;
    case "temporary-boost":
      return registry.getTemporaryBoost(reward.temporaryBoostId)
        ? undefined
        : `Reward '${reward.id}' uses unknown temporary boost`;
    case "temporary-resource":
    case "temporary-unit":
      return undefined;
  }
}

function rejectedResult(
  profile: CampaignProgressionProfile,
  request: CampaignVictoryCommitRequest,
  rejectionReason: string
): CampaignRewardCommitResult {
  return {
    runId: request.runId,
    status: "rejected",
    profile,
    appliedRewardIds: [],
    skippedRewardIds: uniqueSorted(request.discoveredRewardIds),
    warnings: [],
    rejectionReason
  };
}

function cloneProfile(profile: CampaignProgressionProfile): CampaignProgressionProfile {
  return {
    ...profile,
    wallet: { balances: { ...profile.wallet.balances } },
    discoveredUpgradeIds: [...profile.discoveredUpgradeIds],
    permanentUpgradeIds: [...profile.permanentUpgradeIds],
    purchasedUpgradeIds: [...profile.purchasedUpgradeIds],
    unlockIds: [...profile.unlockIds],
    heroProgress: Object.fromEntries(
      Object.entries(profile.heroProgress).map(([id, progress]) => [
        id,
        { upgradeIds: [...progress.upgradeIds], storySkillUnlockIds: [...progress.storySkillUnlockIds] }
      ])
    ),
    factionProgress: Object.fromEntries(
      Object.entries(profile.factionProgress).map(([id, progress]) => [id, { upgradeIds: [...progress.upgradeIds] }])
    ),
    loadouts: Object.fromEntries(
      Object.entries(profile.loadouts).map(([id, loadout]) => [
        id,
        {
          ...loadout,
          upgradeIds: [...loadout.upgradeIds],
          unlockIds: [...loadout.unlockIds],
          inventoryItemIds: [...loadout.inventoryItemIds]
        }
      ])
    ),
    inventory: profile.inventory.map((item) => ({ ...item })),
    rewardClaimIds: [...profile.rewardClaimIds]
  };
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
