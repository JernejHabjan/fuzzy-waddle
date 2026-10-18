import { signal, type Signal } from "@angular/core";
import type {
  CampaignDifficulty,
  CampaignLoadout,
  CampaignMissionId,
  CampaignProfile,
  CampaignProfileData,
  CampaignProfileSyncState,
  CampaignProgressionUpgradeId,
  CampaignRewardCommitResult,
  CampaignRunStartRequest,
  CampaignVictoryCommitRequest
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  createInitialCampaignProfile
} from "@fuzzy-waddle/probable-waffle-campaign";
import { CampaignProfileServiceInterface } from "./campaign-profile.service.interface";

export class CampaignProfileServiceStub extends CampaignProfileServiceInterface {
  private readonly initial = createInitialCampaignProfile(AOTA_CAMPAIGN_PROGRESSION_REGISTRY);
  readonly loaded: Signal<boolean> = signal(true);
  readonly profile: Signal<CampaignProfile> = signal(this.initial);
  readonly profileData: Signal<CampaignProfileData> = signal({ profile: this.initial, completedMissions: [] });
  readonly error: Signal<string | undefined> = signal(undefined);
  readonly syncState: Signal<CampaignProfileSyncState> = signal("guest");
  readonly lastCommitResult: Signal<CampaignRewardCommitResult | undefined> = signal(undefined);

  load(): Promise<void> {
    return Promise.resolve();
  }

  startRun(missionId: CampaignMissionId, difficulty: CampaignDifficulty = "normal"): Promise<CampaignRunStartRequest> {
    return Promise.resolve({
      runId: "00000000-0000-4000-8000-000000000001",
      missionId,
      missionRevision: 1,
      difficulty,
      baseProfileRevision: this.initial.progression.revision,
      selectedLoadoutIds: [],
      loadoutSnapshotHash: "00000000",
      developerOverride: false
    });
  }

  commitVictory(_request: CampaignVictoryCommitRequest): Promise<CampaignRewardCommitResult | undefined> {
    return Promise.resolve(undefined);
  }

  selectActiveLoadouts(_loadoutIds: readonly string[]): Promise<void> {
    return Promise.resolve();
  }

  saveLoadout(_loadout: CampaignLoadout): Promise<boolean> {
    return Promise.resolve(true);
  }

  respec(_upgradeIds: readonly CampaignProgressionUpgradeId[]): Promise<boolean> {
    return Promise.resolve(true);
  }

  markCinematicSeen(_cinematicId: string): Promise<void> {
    return Promise.resolve();
  }
}
