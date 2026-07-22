import type { Signal } from "@angular/core";
import type {
  CampaignMissionId,
  CampaignMissionProgress,
  CampaignProgressData,
  CampaignVictoryCommitRequest
} from "@fuzzy-waddle/probable-waffle-protocol";

/** Read/write campaign progression contract used by the overview and mission lifecycle. */
export abstract class CampaignProgressServiceInterface {
  abstract readonly missionProgress: Signal<CampaignMissionProgress[]>;
  abstract readonly recommendedMission: Signal<CampaignMissionProgress | undefined>;
  abstract setProgress(progress: CampaignProgressData): void;
  abstract load(): Promise<void>;
  abstract startRun(missionId: CampaignMissionId): Promise<string>;
  abstract recordResult(result: CampaignVictoryCommitRequest): Promise<void>;
  abstract getMissionProgress(missionId: CampaignMissionId): CampaignMissionProgress | undefined;
}
