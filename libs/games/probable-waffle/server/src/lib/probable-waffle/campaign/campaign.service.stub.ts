import type { CampaignMissionId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignResultDto } from "./campaign.dto";
import type { CampaignServerServiceInterface } from "./campaign.service.interface";

export const CampaignServerServiceStub = {
  progress: async (_userId: string) => ({ completedMissions: [] }),
  start: async (_userId: string, _runId: string, _missionId: CampaignMissionId) => undefined,
  result: async (_userId: string, _result: CampaignResultDto) => undefined,
  merge: async (_userId: string, _completions: Array<{ missionId: CampaignMissionId; completedAt: string }>) =>
    undefined
} satisfies CampaignServerServiceInterface;
