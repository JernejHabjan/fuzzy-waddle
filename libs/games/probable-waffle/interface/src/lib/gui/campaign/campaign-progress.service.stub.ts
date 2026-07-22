import type {
  CampaignMissionId,
  CampaignMissionOutcome,
  CampaignMissionProgress,
  CampaignProgressData
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CampaignProgressServiceInterface } from "./campaign-progress.service.interface";
import { signal, type Signal } from "@angular/core";

export class CampaignProgressServiceStub extends CampaignProgressServiceInterface {
  readonly missionProgress: Signal<CampaignMissionProgress[]> = signal([]);
  readonly recommendedMission: Signal<CampaignMissionProgress | undefined> = signal(undefined);

  getMissionProgress(missionId: CampaignMissionId): CampaignMissionProgress | undefined {
    return undefined;
  }

  load(): Promise<void> {
    return Promise.resolve();
  }

  recordResult(result: {
    missionId: CampaignMissionId;
    outcome: CampaignMissionOutcome;
    runId: string;
    completedObjectiveIds?: readonly string[];
  }): Promise<void> {
    return Promise.resolve();
  }

  setProgress(progress: CampaignProgressData): void {}

  startRun(missionId: CampaignMissionId): Promise<string> {
    return Promise.resolve("");
  }
}
