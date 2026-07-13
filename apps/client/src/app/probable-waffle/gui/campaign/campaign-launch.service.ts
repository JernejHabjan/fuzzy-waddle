import { Injectable, inject } from "@angular/core";
import {
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  CampaignAvailability,
  type CampaignMissionDefinition
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { CampaignProgressService } from "./campaign-progress.service";
import { CampaignLaunchServiceInterface } from "./campaign-launch.service.interface";
import { environment } from "../../../../environments/environment";

@Injectable({ providedIn: "root" })
/** Coordinates campaign metadata, players, map selection, and direct game navigation. */
export class CampaignLaunchService implements CampaignLaunchServiceInterface {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly campaignProgressService = inject(CampaignProgressService);
  private launchInProgress = false;

  /** Creates a private one-player campaign run and bypasses the skirmish lobby. */
  async startMission(mission: CampaignMissionDefinition): Promise<void> {
    if (this.launchInProgress) return;
    if (environment.production) {
      const missionProgress = this.campaignProgressService.getMissionProgress(mission.id);
      if (
        mission.availability !== CampaignAvailability.Playable ||
        !missionProgress ||
        (missionProgress.state !== "available" && missionProgress.state !== "completed")
      ) {
        throw new Error(`Campaign mission ${mission.id} is not available to launch`);
      }
    }
    this.launchInProgress = true;
    try {
      await this.gameInstanceClientService.createGameInstance(
        `Campaign: ${mission.title}`,
        ProbableWaffleGameInstanceVisibility.Private,
        ProbableWaffleGameInstanceType.Campaign
      );
      const metadata = this.gameInstanceClientService.gameInstance?.gameInstanceMetadata.data;
      if (!metadata) throw new Error("Campaign game metadata is required");
      const runId = await this.campaignProgressService.startRun(mission.id);
      metadata.campaignContext = {
        catalogVersion: AOTA_CAMPAIGN_CATALOG.version,
        chapterId: mission.chapterId,
        missionId: mission.id,
        runId
      };
      await this.gameInstanceClientService.addSelfAsPlayer();
      await this.gameInstanceClientService.addAiPlayer();
      if (!mission.mapId) throw new Error(`Campaign mission ${mission.id} does not define a map`);
      // Preload resolves its map scene and asset pack from game-mode data, so the map must be applied before navigation.
      await this.gameInstanceClientService.gameModeChanged("map", { map: mission.mapId });
      await this.gameInstanceClientService.startGame();
      await this.gameInstanceClientService.navigateDirectlyToGame();
    } catch (error) {
      // A partially configured instance must not leak listeners into the next launch attempt.
      if (this.gameInstanceClientService.gameInstance) await this.gameInstanceClientService.stopGameInstance();
      throw error;
    } finally {
      this.launchInProgress = false;
    }
  }
}
