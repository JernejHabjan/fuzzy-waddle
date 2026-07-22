import type {
  CampaignMissionId,
  CampaignProfile,
  CampaignProfileData,
  CampaignVictoryCommitResponse
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignResultDto, StartCampaignRunDto } from "./campaign.dto";

/** Authenticated campaign run and progress persistence contract. */
export interface CampaignProfileServerServiceInterface {
  profile(userId: string): Promise<CampaignProfileData>;
  updateProfile(userId: string, baseProfileRevision: number, profile: CampaignProfile): Promise<CampaignProfileData>;
  start(userId: string, request: StartCampaignRunDto): Promise<void>;
  result(userId: string, result: CampaignResultDto): Promise<CampaignVictoryCommitResponse>;
  merge(
    userId: string,
    profile: CampaignProfile,
    completions: Array<{ missionId: CampaignMissionId; completedAt: string }>
  ): Promise<CampaignProfileData>;
}

export type CampaignServerServiceInterface = CampaignProfileServerServiceInterface;
