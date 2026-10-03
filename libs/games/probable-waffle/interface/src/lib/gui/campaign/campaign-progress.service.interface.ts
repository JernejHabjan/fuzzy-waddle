import type { Signal } from "@angular/core";
import type {
  CampaignMissionId,
  CampaignMissionProgress,
  CampaignVictoryCommitRequest
} from "@fuzzy-waddle/probable-waffle-protocol";

/** Defines the campaign progress service interface contract used by this module; its declared members form the compatible boundary for linked consumers. */
export abstract class CampaignProgressServiceInterface {
  abstract readonly missionProgress: Signal<CampaignMissionProgress[]>;
  abstract readonly recommendedMission: Signal<CampaignMissionProgress | undefined>;
  abstract load(): Promise<void>;
  abstract startRun(missionId: CampaignMissionId): Promise<string>;
  abstract recordResult(result: CampaignVictoryCommitRequest): Promise<void>;
  abstract getMissionProgress(missionId: CampaignMissionId): CampaignMissionProgress | undefined;
}
