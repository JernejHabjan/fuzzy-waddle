import type {
  CampaignMissionRuntimeState,
  CampaignMissionRuntimeJsonValue
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";

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

export interface CampaignDeveloperCommandResult {
  readonly accepted: boolean;
  readonly invalidatedRewards: boolean;
  readonly reason?: string;
}

export interface CampaignDiagnosticsGraphNode {
  readonly id: string;
  readonly active: boolean;
  readonly completed: boolean;
}

export interface CampaignDiagnosticsGraphEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly candidate: boolean;
}

export interface CampaignDiagnosticsSnapshot {
  readonly schemaVersion: 1;
  readonly missionId: string;
  readonly missionRevision: number;
  readonly status: string;
  readonly phases: {
    readonly active: readonly string[];
    readonly completed: readonly string[];
    readonly graph: {
      readonly nodes: readonly CampaignDiagnosticsGraphNode[];
      readonly edges: readonly CampaignDiagnosticsGraphEdge[];
    };
  };
  readonly objectives: CampaignMissionRuntimeState["objectives"];
  readonly facts: CampaignMissionRuntimeState["facts"];
  readonly counters: CampaignMissionRuntimeState["counters"];
  readonly timers: CampaignMissionRuntimeState["timers"];
  readonly encounters: CampaignMissionRuntimeState["encounters"];
  readonly world: {
    readonly participants: readonly {
      readonly slotId: string;
      readonly controller: string;
      readonly faction: number;
      readonly teamId: string;
    }[];
    readonly references: Readonly<Record<string, readonly string[]>>;
  };
  readonly presentation: {
    readonly activeCinematicId?: string;
    readonly cinematics: CampaignMissionRuntimeState["cinematics"];
    readonly dialoguePresentations: CampaignMissionRuntimeState["dialoguePresentations"];
  };
  readonly saveRecovery: {
    readonly lastCheckpointId?: string;
    readonly pendingCheckpointIds: readonly string[];
  };
  readonly rewards: {
    readonly pendingRewardIds: readonly string[];
    readonly eligible: boolean;
    readonly invalidationReasons: readonly string[];
  };
  readonly diagnostic?: CampaignMissionRuntimeState["integrity"]["diagnostic"];
}

export interface CampaignDeveloperCommandExecutor {
  execute(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult;
  invalidateRewards(reason: "developer-command"): void;
}

export interface CampaignDeveloperCommandDefinitions {
  readonly cinematicIds?: readonly string[];
  readonly rewardIds?: readonly string[];
}

export abstract class CampaignDiagnosticsService {
  abstract snapshot(): CampaignDiagnosticsSnapshot;
  abstract trace(): ReadonlyArray<CampaignMissionRuntimeState["integrity"]["recentTrace"][number]>;
  abstract execute(command: CampaignDeveloperCommand): CampaignDeveloperCommandResult;
}

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
