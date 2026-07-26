import {
  AOTA_CAMPAIGN_CONTENT_REGISTRY,
  CampaignContentAllowanceService,
  resolveCampaignParticipantLaunchSlots,
  resolveMissionDifficulty,
  validateCampaignParticipants
} from "@fuzzy-waddle/probable-waffle-campaign";
import { ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { TechTreeService } from "../../data/tech-tree/tech-tree.service";

/** Defines the campaign participant scene adapter contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignParticipantSceneAdapter {
  /**
   * Applies resolved campaign participant slots to the live scene before gameplay begins.
   * It aligns player/team/controller state with the authored run context so downstream world actions and restore logic use one participant authority.
   */
  static configure(scene: ProbableWaffleScene, allowances: CampaignContentAllowanceService): void {
    const context = scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    if (!context) return;
    const mission = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    if (mission.participants.length === 0) return;
    const errors = validateCampaignParticipants(mission.participants);
    if (errors.length > 0) throw new Error(errors.join("; "));
    const slots = resolveCampaignParticipantLaunchSlots(mission.participants, {
      coop: mission.coop,
      humanParticipantCount: context.humanParticipantCount ?? 1
    });
    if (scene.players.length !== slots.length) {
      throw new Error(
        `Campaign mission '${mission.id}' requires ${slots.length} players; found ${scene.players.length}`
      );
    }
    const playerCount = Math.max(1, slots.filter((slot) => slot.participant.controller === "human").length);
    const difficulty = resolveMissionDifficulty(mission.difficulty, context.difficulty ?? "normal", playerCount);
    const restoredTeams = scene.baseGameData.gameInstance.gameState?.data.campaignMission?.participantTeams;
    for (const slot of slots) {
      const player = scene.players.find((candidate) => candidate.playerNumber === slot.playerNumber);
      const definition = player?.playerController.data.playerDefinition;
      if (!player || !definition) throw new Error(`Campaign participant '${slot.participant.slotId}' has no player`);
      definition.team = restoredTeams?.[String(slot.playerNumber)] ?? slot.teamNumber;
      definition.factionType = slot.participant.faction;
      definition.campaignController = slot.participant.controller === "human" ? undefined : slot.participant.controller;
      definition.campaignEconomy = slot.participant.economy;
      definition.campaignFogPolicy = slot.participant.fogPolicy;
      definition.campaignStartingResources = slot.participant.startingResources
        ? { ...slot.participant.startingResources }
        : undefined;
      definition.campaignDamageScale = slot.participant.controller === "human" ? undefined : difficulty.damageScale;
      definition.campaignAiAggressionScale =
        slot.participant.controller === "full-ai" ? difficulty.aiAggressionScale : undefined;
      definition.campaignAiEnabled =
        slot.participant.controller === "full-ai" ? (definition.campaignAiEnabled ?? true) : undefined;
      if (slot.participant.controller === "full-ai") {
        definition.difficulty =
          context.difficulty === "story"
            ? ProbableWaffleAiDifficulty.Easy
            : context.difficulty === "hard"
              ? ProbableWaffleAiDifficulty.Hard
              : ProbableWaffleAiDifficulty.Medium;
      }
      allowances.configurePlayer(slot.playerNumber, [mission.progressionAllowance]);
      this.validateFullAiAllowance(scene, slot.playerNumber, slot.participant);
      if (!scene.baseGameData.gameInstance.gameInstanceMetadata.isStartupLoad()) {
        this.applyStartingResources(
          player.playerState.data.resources,
          slot.participant,
          difficulty.startingResourceScale
        );
      }
    }
  }

  private static validateFullAiAllowance(
    scene: ProbableWaffleScene,
    playerNumber: number,
    participant: ReturnType<typeof resolveCampaignParticipantLaunchSlots>[number]["participant"]
  ): void {
    if (participant.controller !== "full-ai" || participant.economy !== "normal") return;
    const techTree = getSceneService(scene, TechTreeService);
    if (!techTree) throw new Error("Campaign participant setup requires TechTreeService");
    const denied = techTree
      .getFullAiFoundation(participant.faction)
      .filter((objectName) => !techTree.isContentAllowed(playerNumber, "actor", objectName));
    if (denied.length > 0) {
      throw new Error(
        `Campaign full AI participant '${participant.slotId}' is denied required tech: ${denied.join(", ")}`
      );
    }
  }

  private static applyStartingResources(
    resources: Record<ResourceType, number>,
    participant: ReturnType<typeof resolveCampaignParticipantLaunchSlots>[number]["participant"],
    scale = 1
  ): void {
    for (const resourceType of Object.values(ResourceType)) {
      const amount =
        participant.economy === "none"
          ? 0
          : (participant.startingResources?.[resourceType] ??
            (participant.economy === "normal" ? resources[resourceType] : 0));
      resources[resourceType] = Math.round(amount * scale);
    }
  }
}
