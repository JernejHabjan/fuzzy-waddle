import type {
  CampaignChapterId,
  CampaignContentStatus,
  CampaignFaction,
  CampaignMissionId,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionCheckpointDefinition } from "./mission-checkpoint-definition";
import type { MissionDifficultyDefinition } from "./mission-difficulty-definition";
import type { MissionEncounterDefinition } from "./mission-encounter-definition";
import type { MissionObjectiveDefinition } from "./mission-objective-definition";
import type { MissionParticipantDefinition } from "./mission-participant-definition";
import type { MissionPhaseDefinition } from "./mission-phase-definition";
import type { MissionProgressionAllowance } from "./mission-progression-allowance";
import type { MissionRuntimeInitialState } from "./mission-runtime-initial-state";
import type { MissionScenarioReferences } from "./mission-scenario-references";
import type { MissionRevisionMigration } from "./mission-revision-migration";
import type { MissionCoopOverride } from "./mission-coop-override";

export interface MissionCatalogueDefinition {
  readonly order: number;
  readonly title: string;
  readonly faction: CampaignFaction;
  readonly environment: string;
  readonly briefing: string;
  readonly objectiveSummaries: readonly string[];
}

export interface MissionImplementationBrief {
  readonly summary: string;
  readonly phasePlan: readonly { readonly id: string; readonly description: string }[];
  readonly checkpointCandidates: readonly { readonly id: string; readonly after: string }[];
  readonly plannedScenarioReferences: Readonly<Record<string, readonly string[]>>;
  readonly mechanics: readonly string[];
  readonly coopNotes: readonly string[];
  readonly dependencies: readonly { readonly issue: string; readonly reason: string }[];
  readonly missingAssets: readonly string[];
  readonly tests: readonly string[];
  readonly definitionOfDone: readonly string[];
  readonly implementationTodos: readonly {
    readonly id: string;
    readonly module: string;
    readonly description: string;
  }[];
}

export interface CampaignMissionContent {
  readonly schemaVersion: 1;
  readonly id: CampaignMissionId;
  readonly chapterId: CampaignChapterId;
  readonly revision: number;
  readonly revisionMigrations?: readonly MissionRevisionMigration[];
  readonly mapId: ProbableWaffleMapEnum;
  readonly prerequisites: readonly CampaignMissionId[];
  readonly catalogue: MissionCatalogueDefinition;
  readonly implementation: MissionImplementationBrief;
  readonly participants: readonly MissionParticipantDefinition[];
  readonly coop?: MissionCoopOverride;
  readonly progressionAllowance: MissionProgressionAllowance;
  readonly initialState: MissionRuntimeInitialState;
  readonly phases: readonly MissionPhaseDefinition[];
  readonly objectives: readonly MissionObjectiveDefinition[];
  readonly checkpoints: readonly MissionCheckpointDefinition[];
  readonly encounters?: readonly MissionEncounterDefinition[];
  readonly scenarioReferences?: MissionScenarioReferences;
  readonly difficulty: MissionDifficultyDefinition;
  readonly contentStatus: CampaignContentStatus;
}
