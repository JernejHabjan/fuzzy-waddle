import type { CampaignMissionRuntimeState, MissionRunIntegrityState } from "@fuzzy-waddle/probable-waffle-protocol";

export function createEligibleMissionRunIntegrity(): MissionRunIntegrityState {
  return { eligibleForRewards: true, invalidationReasons: [] };
}

/** Monotonic reward-integrity authority used by developer and cheat mutation entry points. */
export class CampaignRunIntegrityService {
  constructor(private readonly state: CampaignMissionRuntimeState) {}

  current(): MissionRunIntegrityState {
    return this.state.rewardIntegrity ?? createEligibleMissionRunIntegrity();
  }

  invalidate(reason: string): MissionRunIntegrityState {
    const current = this.current();
    const invalidationReasons = [...new Set([...current.invalidationReasons, reason])].sort();
    const next = { eligibleForRewards: false, invalidationReasons };
    this.state.rewardIntegrity = next;
    return next;
  }

  discoverReward(rewardId: string): void {
    if (!this.state.claimedRewardIds.includes(rewardId)) this.state.claimedRewardIds.push(rewardId);
    this.state.claimedRewardIds.sort();
    if (this.state.progression) {
      this.state.progression = {
        ...this.state.progression,
        pendingRewardIds: [...this.state.claimedRewardIds]
      };
    }
  }
}
