import type { CampaignMissionId, CampaignProfile } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  createInitialCampaignProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignResultDto, StartCampaignRunDto } from "./campaign.dto";
import type { CampaignProfileServerServiceInterface } from "./campaign.service.interface";

const stubProfile = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);

export const CampaignProfileServerServiceStub = {
  profile: async (_userId: string) => ({ profile: stubProfile, completedMissions: [] }),
  updateProfile: async (_userId: string, _baseProfileRevision: number, profile: CampaignProfile) => ({
    profile,
    completedMissions: []
  }),
  start: async (_userId: string, _request: StartCampaignRunDto) => undefined,
  result: async (_userId: string, result: CampaignResultDto) => ({
    profileOwnerId: _userId,
    result: {
      runId: result.runId,
      status: "rejected" as const,
      profile: stubProfile.progression,
      appliedRewardIds: [],
      skippedRewardIds: [],
      warnings: [],
      rejectionReason: "stub"
    },
    profileData: { profile: stubProfile, completedMissions: [] }
  }),
  merge: async (
    _userId: string,
    profile: CampaignProfile,
    completions: Array<{ missionId: CampaignMissionId; completedAt: string }>
  ) => ({ profile, completedMissions: completions })
} satisfies CampaignProfileServerServiceInterface;

export const CampaignServerServiceStub = CampaignProfileServerServiceStub;
