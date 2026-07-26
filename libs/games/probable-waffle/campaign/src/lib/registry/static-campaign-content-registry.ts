import type { CampaignId, CampaignMissionId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignDefinition } from "../contracts/campaign-definition";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";
import { CampaignContentRegistry } from "./campaign-content-registry";

/** Defines the static campaign content registry contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class StaticCampaignContentRegistry extends CampaignContentRegistry {
  private readonly campaigns: ReadonlyMap<CampaignId, CampaignDefinition>;
  private readonly missions: ReadonlyMap<CampaignMissionId, CampaignMissionContent>;
  private readonly dialogue: ReadonlyMap<CampaignMissionId, MissionDialogueBundle>;
  private readonly rewards: ReadonlyMap<CampaignMissionId, MissionRewardBundle>;

  constructor(
    campaigns: readonly CampaignDefinition[],
    missions: readonly CampaignMissionContent[],
    dialogue: readonly MissionDialogueBundle[],
    rewards: readonly MissionRewardBundle[]
  ) {
    super();
    this.campaigns = this.toUniqueMap(campaigns, (definition) => definition.id, "campaign");
    this.missions = this.toUniqueMap(missions, (definition) => definition.id, "mission");
    this.dialogue = this.toUniqueMap(dialogue, (definition) => definition.missionId, "dialogue bundle");
    this.rewards = this.toUniqueMap(rewards, (definition) => definition.missionId, "reward bundle");
  }

  getCampaign(id: CampaignId): CampaignDefinition {
    return this.require(this.campaigns, id, "campaign");
  }

  getMission(id: CampaignMissionId): CampaignMissionContent {
    return this.require(this.missions, id, "mission");
  }

  getDialogue(id: CampaignMissionId): MissionDialogueBundle {
    return this.require(this.dialogue, id, "dialogue bundle");
  }

  getRewards(id: CampaignMissionId): MissionRewardBundle {
    return this.require(this.rewards, id, "reward bundle");
  }

  private toUniqueMap<TKey, TValue>(
    values: readonly TValue[],
    keyOf: (value: TValue) => TKey,
    label: string
  ): ReadonlyMap<TKey, TValue> {
    const result = new Map<TKey, TValue>();
    for (const value of values) {
      const key = keyOf(value);
      if (result.has(key)) throw new Error(`Duplicate campaign ${label} '${String(key)}'`);
      result.set(key, value);
    }
    return result;
  }

  private require<TKey, TValue>(values: ReadonlyMap<TKey, TValue>, key: TKey, label: string): TValue {
    const value = values.get(key);
    if (!value) throw new Error(`Unknown campaign ${label} '${String(key)}'`);
    return value;
  }
}
