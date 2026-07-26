import type { Signal } from "@angular/core";
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

/** Defines the campaign profile service interface contract used by this module; its declared members form the compatible boundary for linked consumers. */
export abstract class CampaignProfileServiceInterface {
  abstract readonly loaded: Signal<boolean>;
  abstract readonly profile: Signal<CampaignProfile>;
  abstract readonly profileData: Signal<CampaignProfileData>;
  abstract readonly error: Signal<string | undefined>;
  abstract readonly syncState: Signal<CampaignProfileSyncState>;
  abstract readonly lastCommitResult: Signal<CampaignRewardCommitResult | undefined>;
  abstract load(): Promise<void>;
  abstract startRun(missionId: CampaignMissionId, difficulty?: CampaignDifficulty): Promise<CampaignRunStartRequest>;
  abstract commitVictory(request: CampaignVictoryCommitRequest): Promise<CampaignRewardCommitResult | undefined>;
  abstract selectActiveLoadouts(loadoutIds: readonly string[]): Promise<void>;
  abstract saveLoadout(loadout: CampaignLoadout): Promise<boolean>;
  abstract respec(upgradeIds: readonly CampaignProgressionUpgradeId[]): Promise<boolean>;
  abstract markCinematicSeen(cinematicId: string): Promise<void>;
}
