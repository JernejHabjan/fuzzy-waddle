import { Injectable, inject } from "@angular/core";
import {
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  type CampaignMissionDefinition
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";

@Injectable({ providedIn: "root" })
export class CampaignLaunchService {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private launchInProgress = false;

  /** Creates a private one-player campaign run and bypasses the skirmish lobby. */
  async startMission(mission: CampaignMissionDefinition): Promise<void> {
    if (this.launchInProgress || mission.availability !== "playable") return;
    this.launchInProgress = true;
    try {
      await this.gameInstanceClientService.createGameInstance(
        `Campaign: ${mission.title}`,
        ProbableWaffleGameInstanceVisibility.Private,
        ProbableWaffleGameInstanceType.Campaign
      );
      const metadata = this.gameInstanceClientService.gameInstance?.gameInstanceMetadata.data;
      if (!metadata) throw new Error("Campaign game metadata is required");
      metadata.campaignContext = {
        catalogVersion: AOTA_CAMPAIGN_CATALOG.version,
        chapterId: mission.chapterId,
        missionId: mission.id,
        runId: crypto.randomUUID()
      };
      await this.gameInstanceClientService.addSelfAsPlayer();
      await this.gameInstanceClientService.addAiPlayer();
      await this.gameInstanceClientService.startGame();
      await this.gameInstanceClientService.navigateDirectlyToGame();
    } finally {
      this.launchInProgress = false;
    }
  }
}
