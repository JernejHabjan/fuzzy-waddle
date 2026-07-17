import type { CampaignMissionDefinition } from "@fuzzy-waddle/probable-waffle-protocol";

/** Creates and enters a fully initialized campaign game instance. */
export abstract class CampaignLaunchServiceInterface {
  abstract startMission(mission: CampaignMissionDefinition): Promise<void>;
}
