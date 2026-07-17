import type { CampaignMissionId } from "@fuzzy-waddle/api-interfaces";
import type { CampaignResultDto } from "./campaign.dto";

/** Authenticated campaign run and progress persistence contract. */
export interface CampaignServerServiceInterface {
  progress(userId: string): Promise<unknown>;
  start(userId: string, runId: string, missionId: CampaignMissionId): Promise<void>;
  result(userId: string, result: CampaignResultDto): Promise<void>;
  merge(userId: string, completions: Array<{ missionId: CampaignMissionId; completedAt: string }>): Promise<void>;
}
