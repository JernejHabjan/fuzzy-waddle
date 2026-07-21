import type { CampaignId, CampaignMissionId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignDefinition } from "../contracts/campaign-definition";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";

export abstract class CampaignContentRegistry {
  abstract getCampaign(id: CampaignId): CampaignDefinition;
  abstract getMission(id: CampaignMissionId): CampaignMissionContent;
  abstract getDialogue(id: CampaignMissionId): MissionDialogueBundle;
  abstract getRewards(id: CampaignMissionId): MissionRewardBundle;
}
