import { inject, Injectable } from "@angular/core";
import {
  CampaignAvailability,
  type CampaignDifficulty,
  type CampaignMissionDefinition,
  type PositionPlayerDefinition,
  ProbableWaffleLevels,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  AOTA_CAMPAIGN_PROGRESSION_REGISTRY,
  createCampaignMissionProgressionSnapshot
} from "@fuzzy-waddle/probable-waffle-campaign";
import {
  resolveCampaignParticipantLaunchSlots,
  validateCampaignParticipants
} from "@fuzzy-waddle/probable-waffle-campaign";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { AOTA_CAMPAIGN_CATALOG } from "./campaign-catalog";
import { CampaignProgressService } from "./campaign-progress.service";
import { CampaignProfileService } from "./campaign-profile.service";
import { CampaignLaunchServiceInterface } from "./campaign-launch.service.interface";
import { environment } from "@fuzzy-waddle/environments/environment";

@Injectable({ providedIn: "root" })
/** Defines the campaign launch service contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignLaunchService implements CampaignLaunchServiceInterface {
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly campaignProgressService = inject(CampaignProgressService);
  private readonly campaignProfileService = inject(CampaignProfileService);
  private launchInProgress = false;

  /** Documents the start mission member and its declared contract at this boundary. */
  async startMission(mission: CampaignMissionDefinition, difficulty: CampaignDifficulty = "normal"): Promise<void> {
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
      const missionContent = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(mission.id);
      const participantErrors = validateCampaignParticipants(missionContent.participants);
      if (participantErrors.length > 0) throw new Error(participantErrors.join("; "));
      const launchSlots = resolveCampaignParticipantLaunchSlots(missionContent.participants, {
        coop: missionContent.coop,
        humanParticipantCount: 1
      });
      await this.gameInstanceClientService.createGameInstance(
        `Campaign: ${mission.title}`,
        ProbableWaffleGameInstanceVisibility.Private,
        ProbableWaffleGameInstanceType.Campaign
      );
      const metadata = this.gameInstanceClientService.gameInstance?.gameInstanceMetadata.data;
      if (!metadata) throw new Error("Campaign game metadata is required");
      const run = await this.campaignProfileService.startRun(mission.id, difficulty);
      const progressionSnapshot = createCampaignMissionProgressionSnapshot(
        {
          profile: this.campaignProfileService.profile().progression,
          selectedLoadoutIds: run.selectedLoadoutIds,
          allowance: missionContent.progressionAllowance
        },
        AOTA_CAMPAIGN_PROGRESSION_REGISTRY
      );
      metadata.campaignContext = {
        campaignId: ASHES_OF_THE_ANCIENTS_CAMPAIGN_ID,
        catalogVersion: AOTA_CAMPAIGN_CATALOG.version,
        chapterId: mission.chapterId,
        missionId: mission.id,
        missionRevision: missionContent.revision,
        runId: run.runId,
        difficulty: run.difficulty,
        selectedLoadoutIds: run.selectedLoadoutIds,
        loadoutSnapshotHash: run.loadoutSnapshotHash,
        ...(run.developerOverride ? { developerOverride: true } : {}),
        seenCinematicIds: this.campaignProfileService.profile().seenCinematicIds,
        progressionSnapshot,
        humanParticipantCount: 1,
        participantProgressionSnapshots: launchSlots
          .filter((slot) => slot.participant.profileOwnership !== "none" && slot.participant.controller === "human")
          .map((slot) => ({
            slotId: slot.participant.slotId,
            playerNumber: slot.playerNumber,
            progressionSnapshot
          }))
      };
      if (launchSlots.length === 0) {
        await this.gameInstanceClientService.addSelfAsPlayer();
        await this.gameInstanceClientService.addAiPlayer();
      } else {
        for (const slot of launchSlots) {
          const overrides = {
            team: slot.teamNumber,
            factionType: slot.participant.faction,
            campaignController: slot.participant.controller === "human" ? undefined : slot.participant.controller,
            campaignEconomy: slot.participant.economy,
            campaignFogPolicy: slot.participant.fogPolicy,
            campaignStartingResources: slot.participant.startingResources
              ? { ...slot.participant.startingResources }
              : undefined,
            campaignAiEnabled: slot.participant.controller === "full-ai" ? true : undefined
          } satisfies Partial<PositionPlayerDefinition>;
          if (slot.participant.controller === "human") {
            await this.gameInstanceClientService.addSelfAsPlayer(overrides);
          } else {
            await this.gameInstanceClientService.addAiPlayer(slot.playerPosition, overrides);
          }
        }
      }
      const map = Object.values(ProbableWaffleLevels).find((level) => level.loader.mapSceneKey === mission.mapKey);
      if (!map) throw new Error(`Campaign mission ${mission.id} references unknown map '${mission.mapKey}'`);
      // Preload resolves its map scene and asset pack from game-mode data, so the map must be applied before navigation.
      await this.gameInstanceClientService.gameModeChanged("map", { map: map.id });
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
