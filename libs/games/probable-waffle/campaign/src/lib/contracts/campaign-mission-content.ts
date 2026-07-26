import type {
  CampaignChapterId,
  CampaignContentStatus,
  CampaignFaction,
  CampaignMissionId,
  ProbableWaffleMapKey
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

/**
 * Authored campaign-content contract. The catalogue, runtime, validators, UI, and
 * persistence layers consume this immutable shape after mission JSON is narrowed by
 * {@link loadMissionContent}.
 *
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/701
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/714
 */
export interface MissionCatalogueDefinition {
  /**
   * numeric order carried by {@link MissionCatalogueDefinition}. Its units and valid range are defined by {@link
   * MissionCatalogueDefinition} and must remain consistent across producers and consumers.
   */
  readonly order: number;
  /**
   * human-facing title for {@link MissionCatalogueDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly title: string;
  /**
   * faction value carried by {@link MissionCatalogueDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly faction: CampaignFaction;
  /**
   * string environment carried by {@link MissionCatalogueDefinition}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly environment: string;
  /**
   * human-facing briefing for {@link MissionCatalogueDefinition}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly briefing: string;
  /**
   * collection value on {@link MissionCatalogueDefinition}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly objectiveSummaries: readonly string[];
}

/**
 * Defines the structured mission implementation brief contract for this module. Its declared surface makes
 * summary, phase plan, checkpoint candidates, planned scenario references, mechanics explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface MissionImplementationBrief {
  /**
   * human-facing summary for {@link MissionImplementationBrief}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly summary: string;
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly phasePlan: readonly { readonly id: string; readonly description: string }[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly checkpointCandidates: readonly { readonly id: string; readonly after: string }[];
  /**
   * planned scenario references value carried by {@link MissionImplementationBrief}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly plannedScenarioReferences: MissionScenarioReferences;
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly mechanics: readonly string[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly coopNotes: readonly string[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly dependencies: readonly { readonly issue: string; readonly reason: string }[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly missingAssets: readonly string[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly tests: readonly string[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly definitionOfDone: readonly string[];
  /**
   * collection value on {@link MissionImplementationBrief}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly implementationTodos: readonly {
    readonly id: string;
    readonly module: string;
    readonly description: string;
  }[];
}

/**
 * Complete validated definition for one mission revision. It separates player-facing
 * catalogue metadata from deterministic phases/actions and from optional local
 * presentation bundles, allowing all consumers to share one identity without forcing a
 * scene, profile, or save system to reinterpret JSON independently.
 *
 * ```text
 * catalogue + participants + allowances -> launch/profile validation
 * phases + triggers + objectives         -> CampaignMissionRuntime
 * scenarios + encounters + dialogue      -> Phaser adapters/presentation
 * checkpoints + revision migrations      -> save/replay/reconnect
 * ```
 */
export interface CampaignMissionContent {
  /** Documents the schema version member and its declared contract at this boundary. */
  readonly schemaVersion: 1;
  /** Documents the id member and its declared contract at this boundary. */
  readonly id: CampaignMissionId;
  /** Documents the chapter id member and its declared contract at this boundary. */
  readonly chapterId: CampaignChapterId;
  /** Documents the revision member and its declared contract at this boundary. */
  readonly revision: number;
  /** Documents the revision migrations member and its declared contract at this boundary. */
  readonly revisionMigrations?: readonly MissionRevisionMigration[];
  /** Documents the map key member and its declared contract at this boundary. */
  readonly mapKey: ProbableWaffleMapKey;
  /** Documents the prerequisites member and its declared contract at this boundary. */
  readonly prerequisites: readonly CampaignMissionId[];
  /** Documents the catalogue member and its declared contract at this boundary. */
  readonly catalogue: MissionCatalogueDefinition;
  /** Documents the implementation member and its declared contract at this boundary. */
  readonly implementation: MissionImplementationBrief;
  /** Documents the participants member and its declared contract at this boundary. */
  readonly participants: readonly MissionParticipantDefinition[];
  /** Documents the coop member and its declared contract at this boundary. */
  readonly coop?: MissionCoopOverride;
  /** Documents the progression allowance member and its declared contract at this boundary. */
  readonly progressionAllowance: MissionProgressionAllowance;
  /** Documents the initial state member and its declared contract at this boundary. */
  readonly initialState: MissionRuntimeInitialState;
  /** Documents the phases member and its declared contract at this boundary. */
  readonly phases: readonly MissionPhaseDefinition[];
  /** Documents the objectives member and its declared contract at this boundary. */
  readonly objectives: readonly MissionObjectiveDefinition[];
  /** Documents the checkpoints member and its declared contract at this boundary. */
  readonly checkpoints: readonly MissionCheckpointDefinition[];
  /** Documents the encounters member and its declared contract at this boundary. */
  readonly encounters?: readonly MissionEncounterDefinition[];
  /** Documents the scenario references member and its declared contract at this boundary. */
  readonly scenarioReferences?: MissionScenarioReferences;
  /** Documents the difficulty member and its declared contract at this boundary. */
  readonly difficulty: MissionDifficultyDefinition;
  /** Documents the content status member and its declared contract at this boundary. */
  readonly contentStatus: CampaignContentStatus;
}
