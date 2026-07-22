import { AOTA_CAMPAIGN_CONTENT_REGISTRY, type CampaignMissionContent } from "@fuzzy-waddle/probable-waffle-campaign";
import type {
  CampaignGameContext,
  CampaignMissionRuntimeState,
  CampaignRestoreInvariantReport
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { getSceneService } from "../world/services/scene-component-helpers";
import { SimulationPauseReason, SimulationTickService } from "../world/services/simulation-tick.service";
import { IndexedScenarioReferenceRegistry } from "./scenario/scenario-reference-registry";

export class CampaignRestoreCoordinator {
  constructor(private readonly scene: ProbableWaffleScene) {}

  begin(): void {
    getSceneService(this.scene, SimulationTickService)?.pauseTick(SimulationPauseReason.CampaignRestore);
  }

  complete(): CampaignRestoreInvariantReport {
    const context = this.scene.baseGameData.gameInstance.gameInstanceMetadata.data.campaignContext;
    const runtime = this.scene.baseGameData.gameInstance.gameState?.data.campaignMission;
    const references = getSceneService(this.scene, IndexedScenarioReferenceRegistry);
    const report = validateCampaignRestore(context, runtime, references, this.scene.players.length);
    const gameState = this.scene.baseGameData.gameInstance.gameState;
    if (gameState) gameState.data.campaignRestore = report;
    if (report.status === "valid") {
      getSceneService(this.scene, SimulationTickService)?.resumeTick(SimulationPauseReason.CampaignRestore);
    } else {
      this.scene.communicator.utilityEvents.emit({ name: "campaign-restore-failed", data: report });
    }
    return report;
  }
}

export function validateCampaignRestore(
  context: CampaignGameContext | undefined,
  runtime: CampaignMissionRuntimeState | undefined,
  references?: IndexedScenarioReferenceRegistry,
  participantCount?: number
): CampaignRestoreInvariantReport {
  const issues: string[] = [];
  let content: CampaignMissionContent | undefined;
  if (!context || !runtime) {
    issues.push("Campaign context or mission runtime is missing.");
  } else {
    try {
      content = AOTA_CAMPAIGN_CONTENT_REGISTRY.getMission(context.missionId);
    } catch {
      issues.push(`Mission '${context.missionId}' is not available.`);
    }
    if (runtime.campaignId !== context.campaignId || runtime.missionId !== context.missionId) {
      issues.push("Campaign runtime identity does not match the loaded mission.");
    }
    if (runtime.missionRevision !== context.missionRevision) {
      issues.push("Campaign runtime revision does not match the loaded mission.");
    }
    const saved = context.restoredSaveContext;
    if (saved) {
      if (saved.runId !== context.runId) issues.push("Campaign run identity does not match the loaded save.");
      if (saved.runtimeSchemaVersion !== runtime.schemaVersion) {
        issues.push("Campaign runtime schema does not match the loaded save metadata.");
      }
      if (saved.profileRevision !== (runtime.progression?.baseProfileRevision ?? 0)) {
        issues.push("Campaign profile revision does not match the loaded runtime.");
      }
      if (participantCount !== undefined && saved.participantCount !== participantCount) {
        issues.push("Campaign participant count does not match the loaded save.");
      }
      if (saved.checkpointId && runtime.lastCheckpointId !== saved.checkpointId) {
        issues.push("Campaign checkpoint identity does not match the loaded runtime.");
      }
    }
  }
  if (content && runtime) {
    const phaseIds = new Set(content.phases.map((phase) => String(phase.id)));
    for (const phaseId of [...runtime.activePhaseIds, ...runtime.completedPhaseIds, ...runtime.pendingPhaseIds]) {
      if (!phaseIds.has(phaseId)) issues.push(`Mission phase '${phaseId}' is no longer defined.`);
    }
    const objectiveIds = new Set(content.objectives.map((objective) => String(objective.id)));
    for (const objectiveId of Object.keys(runtime.objectives)) {
      if (!objectiveIds.has(objectiveId)) issues.push(`Mission objective '${objectiveId}' is no longer defined.`);
    }
    const checkpointIds = new Set(content.checkpoints.map((checkpoint) => String(checkpoint.id)));
    for (const checkpointId of [...(runtime.claimedCheckpointIds ?? []), ...(runtime.pendingCheckpointIds ?? [])]) {
      if (!checkpointIds.has(checkpointId)) issues.push(`Mission checkpoint '${checkpointId}' is no longer defined.`);
    }
    if (references && content.scenarioReferences) {
      const knownIds = new Set(references.debugGeometry().map((entry) => entry.id));
      for (const id of Object.values(content.scenarioReferences).filter(Array.isArray).flat()) {
        if (!knownIds.has(String(id))) issues.push(`Required scenario reference '${id}' is missing.`);
      }
    }
  }
  return {
    status: issues.length === 0 ? "valid" : "invalid",
    checkedAtTick: runtime?.integrity.lastProcessedTick ?? 0,
    issues: issues.sort(),
    recoveryOptions: ["earlier-autosave", "restart-mission", "export", "delete"]
  };
}
