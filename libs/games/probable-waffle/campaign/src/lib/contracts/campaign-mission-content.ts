import type {
  CampaignChapterId,
  CampaignContentStatus,
  CampaignFaction,
  CampaignMissionId,
  ProbableWaffleMapKey,
  ScenarioPresentationPolicy
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
 * Durable implementation brief for an authored mission. This is the code-owned
 * replacement for the campaign design notes: it records the intended mission flow,
 * authoring prerequisites, test evidence to obtain, and deliberately unresolved
 * assets without making the deterministic runtime depend on prose outside the
 * repository.
 *
 * The brief is distinct from the executable parts of {@link CampaignMissionContent}.
 * {@link plannedScenarioReferences} and {@link implementationTodos} are planning
 * inputs; {@link CampaignMissionContent.scenarioReferences}, `phases`, `objectives`,
 * and `checkpoints` are the authoritative values a launched mission may consume.
 * Keeping both forms prevents a future mission from being mistakenly advertised as
 * playable merely because its intended flow was documented.
 *
 * @see {@link CampaignMissionContent.contentStatus}
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/714
 */
export interface MissionImplementationBrief {
  /**
   * human-facing summary for {@link MissionImplementationBrief}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly summary: string;
  /**
   * Ordered, human-readable phase outline for authors and reviewers. It must describe
   * the same intended narrative progression as the executable `phases`, but it is not
   * interpreted by {@link CampaignMissionRuntime}; use it to identify missing authored
   * transitions before promoting a skeleton to the `playable` content status.
   */
  readonly phasePlan: readonly { readonly id: string; readonly description: string }[];
  /**
   * Named stable moments at which a later authored {@link MissionCheckpointDefinition}
   * should be placed. These candidates keep recovery intent visible while the map and
   * runtime actions are still being implemented; checkpoint save data is only created
   * from the executable `checkpoints` collection.
   */
  readonly checkpointCandidates: readonly { readonly id: string; readonly after: string }[];
  /**
   * Complete stable-ID manifest the map will eventually expose through the Phaser
   * scenario registry. Unlike {@link CampaignMissionContent.scenarioReferences}, this
   * manifest may name un-authored markers and therefore must not be resolved at launch.
   * The editor validation suite deliberately checks it separately so map work cannot be
   * hidden by a schema-valid skeleton.
   */
  readonly plannedScenarioReferences: MissionScenarioReferences;
  /**
   * Reusable gameplay capabilities this mission is intended to prove or require, such
   * as owner conversion, carry interactions, or a deterministic hazard. This is a
   * design-to-code trace, not an action registry: each item must be backed by a typed
   * action, condition, world adapter, or explicitly deferred work before launch.
   */
  readonly mechanics: readonly string[];
  /**
   * Per-mission compatibility decisions for the future co-op extension. These notes
   * explain why a mission has its present participant layout; executable co-op policy
   * remains owned by {@link MissionCoopOverride} and must never be inferred from prose.
   */
  readonly coopNotes: readonly string[];
  /**
   * Explicit external prerequisites, retained so a skeleton does not silently depend
   * on an unimplemented subsystem or unrelated issue.
   */
  readonly dependencies: readonly { readonly issue: string; readonly reason: string }[];
  /**
   * Presentation assets that may remain placeholders without blocking the deterministic
   * mission path, for example final narration recordings or bespoke portrait art.
   */
  readonly missingAssets: readonly string[];
  /**
   * Scenario-level smoke, restore, and determinism cases that must be exercised before
   * declaring the mission complete. These names are intentionally retained adjacent to
   * content so test intent survives independently of a temporary planning document.
   */
  readonly tests: readonly string[];
  /**
   * Observable completion guarantees for the mission. A `playable` status requires
   * these guarantees to be represented by executable content and validation, while
   * unresolved art or voice work is listed separately in {@link missingAssets}.
   */
  readonly definitionOfDone: readonly string[];
  /**
   * Stable, owner-tagged remaining work. These items must describe a real outstanding
   * asset or implementation gap; they are intentionally visible to catalogue audits so
   * placeholder status cannot be mistaken for feature completion.
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
  /**
   * Code-owned authoring brief and traceability ledger. It is visible in every mission
   * directory, but the runtime deliberately does not execute it; see
   * {@link MissionImplementationBrief} for the boundary between a plan and playable
   * content.
   */
  readonly implementation: MissionImplementationBrief;
  /**
   * Optional scenario-level HUD policy copied into authoritative game-mode data when
   * this mission launches. It remains independent of campaign runtime state so the
   * shared policy can also be authored by non-campaign scenarios.
   */
  readonly scenarioPresentation?: ScenarioPresentationPolicy;
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
  /**
   * Stable editor IDs that must resolve in the map loaded by {@link mapKey}. A playable
   * mission may only reference markers declared here after semantic map validation;
   * planned-but-unauthored markers remain in
   * {@link MissionImplementationBrief.plannedScenarioReferences}.
   */
  readonly scenarioReferences?: MissionScenarioReferences;
  /** Documents the difficulty member and its declared contract at this boundary. */
  readonly difficulty: MissionDifficultyDefinition;
  /**
   * Launchability boundary owned by the catalogue. `skeleton` missions remain visible
   * as planned content but cannot launch; `playable` missions have executable runtime
   * content and resolved scenario references; `complete` is reserved for a fully
   * shipped mission after its remaining content work is cleared. Do not promote this
   * value solely because its JSON schema and implementation brief are complete.
   */
  readonly contentStatus: CampaignContentStatus;
}
