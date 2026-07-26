import type {
  CampaignMissionRuntimeJsonValue,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";

/**
 * Developer-only inspection and mutation contracts. Mutations must invalidate run
 * integrity before execution; inspect-only commands are deliberately side-effect free.
 *
 * @see CampaignRunIntegrityService
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/713
 */
export type CampaignDeveloperCommand =
  | { readonly kind: "set-fact"; readonly factId: string; readonly value: boolean | string }
  | { readonly kind: "set-counter"; readonly counterId: string; readonly value: number }
  | { readonly kind: "set-objective"; readonly objectiveId: string; readonly state: "completed" | "failed" }
  | { readonly kind: "fire-trigger"; readonly triggerId: string }
  | { readonly kind: "play-cinematic"; readonly cinematicId: string }
  | { readonly kind: "start-wave"; readonly encounterId: string }
  | { readonly kind: "revive-hero"; readonly actorId: string }
  | { readonly kind: "request-outcome"; readonly outcome: "victory" | "defeat" }
  | { readonly kind: "discover-reward"; readonly rewardId: string }
  | { readonly kind: "focus-actor"; readonly actorId: string }
  | { readonly kind: "highlight-region"; readonly regionId: string };

/**
 * Defines the structured campaign developer command result contract for this module. Its declared surface
 * makes accepted, invalidated rewards, reason explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignDeveloperCommandResult {
  /**
   * accepted value carried by {@link CampaignDeveloperCommandResult}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly accepted: boolean;
  /**
   * invalidated rewards value carried by {@link CampaignDeveloperCommandResult}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly invalidatedRewards: boolean;
  /**
   * Optional string reason carried by {@link CampaignDeveloperCommandResult}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly reason?: string;
}

/**
 * Defines the structured campaign diagnostics graph node contract for this module. Its declared surface makes
 * id, active, completed explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignDiagnosticsGraphNode {
  /**
   * stable id used by {@link CampaignDiagnosticsGraphNode} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: string;
  /**
   * active value carried by {@link CampaignDiagnosticsGraphNode}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly active: boolean;
  /**
   * completed value carried by {@link CampaignDiagnosticsGraphNode}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly completed: boolean;
}

/**
 * Defines the structured campaign diagnostics graph edge contract for this module. Its declared surface makes
 * id, from, to, candidate explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignDiagnosticsGraphEdge {
  /**
   * stable id used by {@link CampaignDiagnosticsGraphEdge} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: string;
  /**
   * string from carried by {@link CampaignDiagnosticsGraphEdge}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly from: string;
  /**
   * string to carried by {@link CampaignDiagnosticsGraphEdge}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly to: string;
  /**
   * boolean policy/value on {@link CampaignDiagnosticsGraphEdge} that explicitly controls whether the associated
   * behavior is active; do not infer it from unrelated state.
   */
  readonly candidate: boolean;
}

/**
 * Defines the structured campaign diagnostics snapshot contract for this module. Its declared surface makes
 * schema version, mission id, mission revision, status, phases explicit to every consumer. Use this shared
 * shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignDiagnosticsSnapshot {
  /**
   * compatibility schema version for {@link CampaignDiagnosticsSnapshot}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * stable mission id used by {@link CampaignDiagnosticsSnapshot} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly missionId: string;
  /**
   * compatibility mission revision for {@link CampaignDiagnosticsSnapshot}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly missionRevision: number;
  /**
   * discriminator for {@link CampaignDiagnosticsSnapshot}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: string;
  /**
   * collection owned by {@link CampaignDiagnosticsSnapshot}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly phases: {
    /**
     * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
     * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    readonly active: readonly string[];
    /**
     * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
     * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    readonly completed: readonly string[];
    /**
     * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
     * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    readonly graph: {
      /**
       * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
       * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      readonly nodes: readonly CampaignDiagnosticsGraphNode[];
      /**
       * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
       * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      readonly edges: readonly CampaignDiagnosticsGraphEdge[];
    };
  };
  /**
   * collection owned by {@link CampaignDiagnosticsSnapshot}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly objectives: CampaignMissionRuntimeState["objectives"];
  /**
   * facts value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly facts: CampaignMissionRuntimeState["facts"];
  /**
   * counters value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly counters: CampaignMissionRuntimeState["counters"];
  /**
   * timers value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly timers: CampaignMissionRuntimeState["timers"];
  /**
   * encounters value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly encounters: CampaignMissionRuntimeState["encounters"];
  /**
   * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly world: {
    /**
     * collection owned by {@link CampaignDiagnosticsSnapshot}. Preserve the declared element contract and any
     * ordering/uniqueness semantics when reading, serializing, or extending it.
     */
    readonly participants: readonly {
      readonly slotId: string;
      readonly controller: string;
      readonly faction: number;
      readonly teamId: string;
    }[];
    /**
     * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
     * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    readonly references: Readonly<Record<string, readonly string[]>>;
  };
  /**
   * keyed/nested presentation structure owned by {@link CampaignDiagnosticsSnapshot}. Keep its keys and value
   * contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  readonly presentation: {
    /**
     * Optional stable active cinematic id used by {@link CampaignDiagnosticsSnapshot} to correlate this value with
     * related records, events, or authored content; it is not a display label.
     */
    readonly activeCinematicId?: string;
    /**
     * cinematics value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the compatibility
     * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
     */
    readonly cinematics: CampaignMissionRuntimeState["cinematics"];
    /**
     * dialogue presentations value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the
     * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
     * shape.
     */
    readonly dialoguePresentations: CampaignMissionRuntimeState["dialoguePresentations"];
  };
  /**
   * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly saveRecovery: {
    /**
     * Optional stable last checkpoint id used by {@link CampaignDiagnosticsSnapshot} to correlate this value with
     * related records, events, or authored content; it is not a display label.
     */
    readonly lastCheckpointId?: string;
    /**
     * collection owned by {@link CampaignDiagnosticsSnapshot}. Preserve the declared element contract and any
     * ordering/uniqueness semantics when reading, serializing, or extending it.
     */
    readonly pendingCheckpointIds: readonly string[];
  };
  /**
   * collection owned by {@link CampaignDiagnosticsSnapshot}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly rewards: {
    /**
     * collection owned by {@link CampaignDiagnosticsSnapshot}. Preserve the declared element contract and any
     * ordering/uniqueness semantics when reading, serializing, or extending it.
     */
    readonly pendingRewardIds: readonly string[];
    /**
     * boolean policy/value on {@link CampaignDiagnosticsSnapshot} that explicitly controls whether the associated
     * behavior is active; do not infer it from unrelated state.
     */
    readonly eligible: boolean;
    /**
     * collection value on {@link CampaignDiagnosticsSnapshot}. Its element type defines the records that may cross
     * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    readonly invalidationReasons: readonly string[];
  };
  /**
   * Optional diagnostic value carried by {@link CampaignDiagnosticsSnapshot}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly diagnostic?: CampaignMissionRuntimeState["integrity"]["diagnostic"];
}

/**
 * Defines the structured campaign developer command executor contract for this module. Its declared surface
 * makes execute, invalidate rewards explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignDeveloperCommandExecutor {
  /**
   * operation exposed by {@link CampaignDeveloperCommandExecutor}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  execute(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult;
  /**
   * operation exposed by {@link CampaignDeveloperCommandExecutor}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  invalidateRewards(reason: "developer-command"): void;
}

/**
 * Defines the structured campaign developer command definitions contract for this module. Its declared surface
 * makes cinematic ids, reward ids explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignDeveloperCommandDefinitions {
  /**
   * Optional collection owned by {@link CampaignDeveloperCommandDefinitions}. Preserve the declared element
   * contract and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly cinematicIds?: readonly string[];
  /**
   * Optional collection owned by {@link CampaignDeveloperCommandDefinitions}. Preserve the declared element
   * contract and any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly rewardIds?: readonly string[];
}

export abstract class CampaignDiagnosticsService {
  abstract snapshot(): CampaignDiagnosticsSnapshot;
  abstract trace(): ReadonlyArray<CampaignMissionRuntimeState["integrity"]["recentTrace"][number]>;
  abstract execute(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult;
}

/**
 * Read-only diagnostics and explicitly invalidating developer-command gateway. It builds
 * a stable graph/snapshot from authored content plus runtime state, and validates every
 * mutation against declared debug permissions before the executor is called.
 *
 * ```text
 * content + runtime -> diagnostics graph/HUD (read-only)
 * developer command -> validate -> invalidate integrity -> runtime executor
 * ```
 */
export class DefaultCampaignDiagnosticsService extends CampaignDiagnosticsService {
  constructor(
    private readonly content: CampaignMissionContent,
    private readonly state: () => CampaignMissionRuntimeState,
    private readonly executor: CampaignDeveloperCommandExecutor,
    private readonly mutationsEnabled: boolean,
    private readonly definitions: CampaignDeveloperCommandDefinitions = {}
  ) {
    super();
  }

  /**
   * Materializes a deep-copied, read-only diagnostic view of the current authoritative
   * mission state. The snapshot intentionally groups state by the maintainer questions it
   * answers—statechart, world bindings, presentation, save recovery, and rewards—without
   * exposing mutable runtime references to the developer HUD or graph tooling.
   *
   * @see {@link campaignDiagnosticsGraph} for deterministic phase-edge projection.
   * @see {@link execute} for the separate, integrity-gated mutation path.
   */
  snapshot(): CampaignDiagnosticsSnapshot {
    const state = this.state();
    return {
      schemaVersion: 1,
      missionId: state.missionId,
      missionRevision: state.missionRevision,
      status: state.status,
      phases: {
        active: [...state.activePhaseIds],
        completed: [...state.completedPhaseIds],
        graph: campaignDiagnosticsGraph(this.content, state)
      },
      objectives: structuredClone(state.objectives),
      facts: { ...state.facts },
      counters: { ...state.counters },
      timers: structuredClone(state.timers),
      encounters: structuredClone(state.encounters),
      world: {
        participants: this.content.participants.map((participant) => ({
          slotId: participant.slotId,
          controller: participant.controller,
          faction: participant.faction,
          teamId: participant.teamId
        })),
        references: Object.fromEntries(
          Object.entries(this.content.scenarioReferences ?? {}).map(([kind, ids]) => [kind, [...ids]])
        )
      },
      presentation: {
        ...(state.activeCinematicId ? { activeCinematicId: state.activeCinematicId } : {}),
        cinematics: structuredClone(state.cinematics),
        dialoguePresentations: structuredClone(state.dialoguePresentations)
      },
      saveRecovery: {
        ...(state.lastCheckpointId ? { lastCheckpointId: state.lastCheckpointId } : {}),
        pendingCheckpointIds: [...(state.pendingCheckpointIds ?? [])]
      },
      rewards: {
        pendingRewardIds: [...state.claimedRewardIds],
        eligible: state.rewardIntegrity?.eligibleForRewards ?? true,
        invalidationReasons: [...(state.rewardIntegrity?.invalidationReasons ?? [])]
      },
      ...(state.integrity.diagnostic ? { diagnostic: structuredClone(state.integrity.diagnostic) } : {})
    };
  }

  trace(): ReadonlyArray<CampaignMissionRuntimeState["integrity"]["recentTrace"][number]> {
    return structuredClone(this.state().integrity.recentTrace);
  }

  execute(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult {
    const reason = validateDeveloperCommand(this.content, command, this.definitions);
    if (reason) return { accepted: false, invalidatedRewards: false, reason };
    if (isInspectOnlyCommand(command)) return this.executor.execute(command);
    if (!this.mutationsEnabled) {
      return { accepted: false, invalidatedRewards: false, reason: "Developer mutations are disabled" };
    }
    this.executor.invalidateRewards("developer-command");
    const result = this.executor.execute(command);
    return { ...result, invalidatedRewards: true };
  }
}

export function campaignProductionInvariantReport(
  state: CampaignMissionRuntimeState,
  seed: number
): Readonly<Record<string, CampaignMissionRuntimeJsonValue>> {
  return {
    missionId: state.missionId,
    missionRevision: state.missionRevision,
    status: state.status,
    activePhaseIds: [...state.activePhaseIds],
    objectives: Object.fromEntries(Object.entries(state.objectives).map(([id, objective]) => [id, objective.status])),
    facts: { ...state.facts },
    counters: { ...state.counters },
    seed
  };
}

function campaignDiagnosticsGraph(
  content: CampaignMissionContent,
  state: CampaignMissionRuntimeState
): { readonly nodes: CampaignDiagnosticsGraphNode[]; readonly edges: CampaignDiagnosticsGraphEdge[] } {
  const nodes = content.phases.map((phase) => ({
    id: phase.id,
    active: state.activePhaseIds.includes(phase.id),
    completed: state.completedPhaseIds.includes(phase.id)
  }));
  const edges = content.phases.flatMap((phase) =>
    phase.transitions.flatMap((transition) =>
      transition.targetPhaseIds.map((target) => ({
        id: transition.id,
        from: phase.id,
        to: target,
        candidate: state.activePhaseIds.includes(phase.id)
      }))
    )
  );
  return { nodes, edges };
}

/**
 * Validates a developer command against authored debug permissions and current runtime state before it can execute.
 * The result explains rejected commands and distinguishes inspect-only operations from mutations that must invalidate reward integrity.
 */
function validateDeveloperCommand(
  content: CampaignMissionContent,
  command: CampaignDeveloperCommand,
  definitions: CampaignDeveloperCommandDefinitions
): string | undefined {
  switch (command.kind) {
    case "set-fact":
      return content.initialState.facts.some((fact) => fact.id === command.factId && fact.debugMutable)
        ? undefined
        : `Fact '${command.factId}' is not declared debug-mutable`;
    case "set-counter":
      return content.initialState.counters.some((counter) => counter.id === command.counterId && counter.debugMutable)
        ? undefined
        : `Counter '${command.counterId}' is not declared debug-mutable`;
    case "set-objective":
      return content.objectives.some((objective) => objective.id === command.objectiveId)
        ? undefined
        : `Objective '${command.objectiveId}' is not defined`;
    case "fire-trigger":
      return content.phases.some((phase) => phase.triggers.some((trigger) => trigger.id === command.triggerId))
        ? undefined
        : `Trigger '${command.triggerId}' is not defined`;
    case "play-cinematic":
      return definitions.cinematicIds?.includes(command.cinematicId)
        ? undefined
        : `Cinematic '${command.cinematicId}' is not defined`;
    case "start-wave":
      return content.encounters?.some((encounter) => encounter.id === command.encounterId)
        ? undefined
        : `Encounter '${command.encounterId}' is not defined`;
    case "discover-reward":
      return definitions.rewardIds?.includes(command.rewardId)
        ? undefined
        : `Reward '${command.rewardId}' is not defined`;
    case "revive-hero":
      return content.scenarioReferences?.actors?.some((actorId) => actorId === command.actorId)
        ? undefined
        : `Actor '${command.actorId}' is not defined`;
    case "focus-actor":
      return content.scenarioReferences?.actors?.some((actorId) => actorId === command.actorId)
        ? undefined
        : `Actor '${command.actorId}' is not defined`;
    case "request-outcome":
      return undefined;
    case "highlight-region":
      return content.scenarioReferences?.regions?.some((regionId) => regionId === command.regionId)
        ? undefined
        : `Region '${command.regionId}' is not defined`;
  }
}

function isInspectOnlyCommand(command: CampaignDeveloperCommand): boolean {
  return command.kind === "focus-actor" || command.kind === "highlight-region";
}
