import type { CampaignMissionDefinition } from "@fuzzy-waddle/api-interfaces";

/** Creates and enters a fully initialized campaign game instance. */
export abstract class CampaignLaunchServiceInterface {
  abstract startMission(mission: CampaignMissionDefinition): Promise<void>;
}
