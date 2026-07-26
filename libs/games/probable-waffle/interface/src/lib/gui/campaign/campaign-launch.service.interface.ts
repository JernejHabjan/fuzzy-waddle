import type { CampaignDifficulty, CampaignMissionDefinition } from "@fuzzy-waddle/probable-waffle-protocol";

/** Defines the campaign launch service interface contract used by this module; its declared members form the compatible boundary for linked consumers. */
export abstract class CampaignLaunchServiceInterface {
  abstract startMission(mission: CampaignMissionDefinition, difficulty?: CampaignDifficulty): Promise<void>;
}
