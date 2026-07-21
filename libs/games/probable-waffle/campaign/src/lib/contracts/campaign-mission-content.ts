import type {
  CampaignChapterId,
  CampaignContentStatus,
  CampaignFaction,
  CampaignMissionId,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionCheckpointDefinition } from "./mission-checkpoint-definition";
import type { MissionDifficultyDefinition } from "./mission-difficulty-definition";
import type { MissionObjectiveDefinition } from "./mission-objective-definition";
import type { MissionParticipantDefinition } from "./mission-participant-definition";
import type { MissionPhaseDefinition } from "./mission-phase-definition";
import type { MissionProgressionAllowance } from "./mission-progression-allowance";
import type { MissionRuntimeInitialState } from "./mission-runtime-initial-state";
import type { MissionScenarioReferences } from "./mission-scenario-references";

export interface MissionCatalogueDefinition {
  readonly order: number;
  readonly title: string;
  readonly faction: CampaignFaction;
  readonly environment: string;
  readonly briefing: string;
  readonly objectiveSummaries: readonly string[];
}

export interface CampaignMissionContent {
  readonly schemaVersion: 1;
  readonly id: CampaignMissionId;
  readonly chapterId: CampaignChapterId;
  readonly revision: number;
  readonly mapId: ProbableWaffleMapEnum;
  readonly prerequisites: readonly CampaignMissionId[];
  readonly catalogue: MissionCatalogueDefinition;
  readonly participants: readonly MissionParticipantDefinition[];
  readonly progressionAllowance: MissionProgressionAllowance;
  readonly initialState: MissionRuntimeInitialState;
  readonly phases: readonly MissionPhaseDefinition[];
  readonly objectives: readonly MissionObjectiveDefinition[];
  readonly checkpoints: readonly MissionCheckpointDefinition[];
  readonly scenarioReferences?: MissionScenarioReferences;
  readonly difficulty: MissionDifficultyDefinition;
  readonly contentStatus: CampaignContentStatus;
}
