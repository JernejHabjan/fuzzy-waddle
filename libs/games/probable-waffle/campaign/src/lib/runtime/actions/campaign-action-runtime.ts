import type {
  CampaignMissionActionContinuationState,
  CampaignMissionOwnedResourceRuntimeState,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeJsonValue,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CAMPAIGN_ACTION_KINDS, type CampaignActionKind } from "../../contracts/campaign-content-kinds";
import {
  isCompositeMissionAction,
  type MissionActionDefinition,
  type MissionCompositeActionDefinition
} from "../../contracts/mission-action-definition";

export type CampaignMissionActionCancelReason =
  | "phase-exited"
  | "mission-ended"
  | "scene-shutdown"
  | "race-lost"
  | "action-removed";

export interface CampaignMissionActionOwnedResource {
  readonly resourceId: string;
  readonly kind: string;
  readonly state?: CampaignMissionRuntimeJsonValue;
}

interface CampaignMissionActionResultBase {
  readonly ownedResources?: readonly CampaignMissionActionOwnedResource[];
}

export type CampaignMissionActionResult =
  | (CampaignMissionActionResultBase & { readonly status: "completed" })
  | (CampaignMissionActionResultBase & { readonly status: "skipped"; readonly reason: string })
  | (CampaignMissionActionResultBase & {
      readonly status: "waiting";
      readonly continuationState: CampaignMissionRuntimeJsonValue;
    })
  | (CampaignMissionActionResultBase & {
      readonly status: "failed";
      readonly code: "missing-reference" | "execution-failed" | "unresumable" | "resource-leak";
      readonly message: string;
      readonly continuationState?: CampaignMissionRuntimeJsonValue;
    });

export interface CampaignMissionActionContext {
  readonly tick: number;
  readonly state: CampaignMissionRuntimeState;
  readonly ownerToken: string;
  readonly phaseId?: string;
  readonly triggerId?: string;
  readonly event?: CampaignMissionRuntimeEvent;
  readonly objectiveActions?: CampaignObjectiveActionPort;
  readonly presentationActions?: CampaignPresentationActionPort;
}

export interface CampaignObjectiveActionPort {
  setState(definition: Extract<MissionActionDefinition, { readonly kind: "set-objective-state" }>, tick: number): void;
  setChecklistState(
    definition: Extract<MissionActionDefinition, { readonly kind: "set-objective-checklist-state" }>,
    tick: number
  ): void;
}

export interface CampaignPresentationActionPort {
  setDialogueState(
    definition: Extract<MissionActionDefinition, { readonly kind: "set-dialogue-state" }>,
    context: CampaignMissionActionContext
  ): void;
  setCinematicStage(
    definition: Extract<MissionActionDefinition, { readonly kind: "set-cinematic-stage" }>,
    context: CampaignMissionActionContext
  ): void;
}

export interface CampaignActionExecutor<TDefinition extends MissionActionDefinition = MissionActionDefinition> {
  readonly kind: TDefinition["kind"];
  execute(context: CampaignMissionActionContext, definition: TDefinition): CampaignMissionActionResult;
  resume?(
    context: CampaignMissionActionContext,
    definition: TDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult;
  cancel?(
    context: CampaignMissionActionContext,
    definition: TDefinition,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void;
}

export interface CampaignWorldActionAdapter {
  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult;
  resume?(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult;
  cancel?(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void;
  restoreOwnedResources?(resources: readonly CampaignMissionOwnedResourceRuntimeState[]): void;
  releaseOwnedResources?(
    ownerToken: string,
    resources: readonly CampaignMissionOwnedResourceRuntimeState[],
    reason: CampaignMissionActionCancelReason
  ): readonly string[];
}

export class CampaignActionExecutorRegistry {
  private readonly executors = new Map<CampaignActionKind, CampaignActionExecutor>();

  register(executor: CampaignActionExecutor): void {
    if (this.executors.has(executor.kind)) {
      throw new Error(`Campaign action executor '${executor.kind}' is already registered`);
    }
    this.executors.set(executor.kind, executor);
  }

  getRequired(kind: CampaignActionKind): CampaignActionExecutor {
    const executor = this.executors.get(kind);
    if (!executor) throw new Error(`Campaign action executor '${kind}' is not registered`);
    return executor;
  }

  kinds(): readonly CampaignActionKind[] {
    return [...this.executors.keys()].sort();
  }
}

/** Runs leaf executors plus serializable sequence/parallel/race action nodes. */
export class CampaignActionRunner {
  constructor(
    private readonly registry: CampaignActionExecutorRegistry,
    private readonly worldAdapter?: CampaignWorldActionAdapter
  ) {}

  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    return isCompositeMissionAction(definition)
      ? this.executeComposite(context, definition)
      : this.registry.getRequired(definition.kind).execute(context, definition);
  }

  resume(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult {
    if (isCompositeMissionAction(definition)) return this.resumeComposite(context, definition, continuationState);
    const executor = this.registry.getRequired(definition.kind);
    return executor.resume
      ? executor.resume(context, definition, continuationState)
      : { status: "failed", code: "unresumable", message: `Action '${definition.id}' cannot resume` };
  }

  cancel(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void {
    if (isCompositeMissionAction(definition)) {
      this.cancelComposite(context, definition, continuationState, reason);
      return;
    }
    this.registry.getRequired(definition.kind).cancel?.(context, definition, continuationState, reason);
  }

  private executeComposite(
    context: CampaignMissionActionContext,
    definition: MissionCompositeActionDefinition
  ): CampaignMissionActionResult {
    if (definition.kind === "sequence") return this.executeSequence(context, definition, 0);
    if (definition.kind === "race") return this.executeRace(context, definition);
    const children = definition.actions.map((action) => ({ action, result: this.execute(context, action) }));
    const failure = children.find((child) => child.result.status === "failed")?.result;
    if (failure?.status === "failed") return failure;
    const waitingChildren = children.flatMap((child, index) =>
      child.result.status === "waiting"
        ? [
            {
              index,
              actionId: child.action.id,
              state: child.result.continuationState,
              resourceIds: (child.result.ownedResources ?? []).map((resource) => resource.resourceId)
            }
          ]
        : []
    );
    return waitingChildren.length === 0
      ? { status: "completed", ownedResources: collectOwnedResources(children.map((child) => child.result)) }
      : {
          status: "waiting",
          continuationState: { children: waitingChildren },
          ownedResources: collectOwnedResources(children.map((child) => child.result))
        };
  }

  private executeRace(
    context: CampaignMissionActionContext,
    definition: MissionCompositeActionDefinition
  ): CampaignMissionActionResult {
    const waiting: { action: MissionActionDefinition; result: CampaignMissionActionResult }[] = [];
    for (const action of definition.actions) {
      const result = this.execute(context, action);
      if (result.status === "failed") return result;
      if (result.status === "completed" || result.status === "skipped") {
        for (const loser of waiting) {
          if (loser.result.status === "waiting") {
            this.cancel(context, loser.action, loser.result.continuationState, "race-lost");
          }
        }
        const cleanupFailure = this.releaseRaceResources(
          context,
          waiting.flatMap((loser) => loser.result.ownedResources ?? [])
        );
        return cleanupFailure ?? { status: "completed", ownedResources: result.ownedResources };
      }
      waiting.push({ action, result });
    }
    return {
      status: "waiting",
      continuationState: {
        children: waiting.map((child, index) => ({
          index,
          actionId: child.action.id,
          state: child.result.status === "waiting" ? child.result.continuationState : null,
          resourceIds: (child.result.ownedResources ?? []).map((resource) => resource.resourceId)
        }))
      },
      ownedResources: collectOwnedResources(waiting.map((child) => child.result))
    };
  }

  private executeSequence(
    context: CampaignMissionActionContext,
    definition: MissionCompositeActionDefinition,
    startIndex: number
  ): CampaignMissionActionResult {
    const resources: CampaignMissionActionOwnedResource[] = [];
    for (let index = startIndex; index < definition.actions.length; index += 1) {
      const action = definition.actions[index]!;
      const result = this.execute(context, action);
      resources.push(...(result.ownedResources ?? []));
      if (result.status === "failed") return { ...result, ownedResources: resources };
      if (result.status === "waiting") {
        return {
          status: "waiting",
          continuationState: { index, actionId: action.id, state: result.continuationState },
          ownedResources: resources
        };
      }
    }
    return { status: "completed", ownedResources: resources };
  }

  private resumeComposite(
    context: CampaignMissionActionContext,
    definition: MissionCompositeActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult {
    if (!isJsonRecord(continuationState)) return invalidCompositeState(definition.id);
    if (definition.kind === "sequence") {
      const index = continuationState["index"];
      const state = continuationState["state"];
      if (typeof index !== "number" || state === undefined || !definition.actions[index]) {
        return invalidCompositeState(definition.id);
      }
      const child = definition.actions[index]!;
      const result = this.resume(context, child, state);
      if (result.status === "waiting") {
        return {
          ...result,
          continuationState: { index, actionId: child.id, state: result.continuationState }
        };
      }
      if (result.status === "failed") return result;
      const remaining = this.executeSequence(context, definition, index + 1);
      return mergeOwnedResources(result, remaining);
    }
    const childStates = continuationState["children"];
    if (!Array.isArray(childStates)) return invalidCompositeState(definition.id);
    const results: CampaignMissionActionResult[] = [];
    const nextChildren: {
      index: number;
      actionId: string;
      state: CampaignMissionRuntimeJsonValue;
      resourceIds: string[];
    }[] = [];
    for (const candidate of childStates) {
      if (!isJsonRecord(candidate) || typeof candidate["index"] !== "number" || candidate["state"] === undefined) {
        return invalidCompositeState(definition.id);
      }
      const index = candidate["index"];
      const child = definition.actions[index];
      if (!child) return invalidCompositeState(definition.id);
      const result = this.resume(context, child, candidate["state"]);
      results.push(result);
      const previousResourceIds = Array.isArray(candidate["resourceIds"])
        ? candidate["resourceIds"].filter((value): value is string => typeof value === "string")
        : [];
      if (result.status === "failed") return result;
      if (result.status === "waiting") {
        nextChildren.push({
          index,
          actionId: child.id,
          state: result.continuationState,
          resourceIds: [
            ...new Set([...previousResourceIds, ...(result.ownedResources ?? []).map((item) => item.resourceId)])
          ].sort()
        });
      } else if (definition.kind === "race") {
        this.cancelStoredChildren(context, definition, childStates, index);
        const losingResourceIds = childStates.flatMap((stored) => {
          if (!isJsonRecord(stored) || stored["index"] === index || !Array.isArray(stored["resourceIds"])) return [];
          return stored["resourceIds"].filter((value): value is string => typeof value === "string");
        });
        const freshLosingResources = results
          .slice(0, -1)
          .flatMap((candidateResult) => candidateResult.ownedResources ?? []);
        const cleanupFailure = this.releaseRaceResources(context, freshLosingResources, losingResourceIds);
        if (cleanupFailure) return cleanupFailure;
        return { status: "completed", ownedResources: results.at(-1)?.ownedResources };
      }
    }
    return nextChildren.length === 0
      ? { status: "completed", ownedResources: collectOwnedResources(results) }
      : {
          status: "waiting",
          continuationState: { children: nextChildren },
          ownedResources: collectOwnedResources(results)
        };
  }

  private cancelComposite(
    context: CampaignMissionActionContext,
    definition: MissionCompositeActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void {
    if (!isJsonRecord(continuationState)) return;
    if (definition.kind === "sequence") {
      const index = continuationState["index"];
      const state = continuationState["state"];
      if (typeof index === "number" && state !== undefined && definition.actions[index]) {
        this.cancel(context, definition.actions[index]!, state, reason);
      }
      return;
    }
    const children = continuationState["children"];
    if (!Array.isArray(children)) return;
    this.cancelStoredChildren(context, definition, children, -1, reason);
  }

  private releaseRaceResources(
    context: CampaignMissionActionContext,
    freshResources: readonly CampaignMissionActionOwnedResource[],
    storedResourceIds: readonly string[] = []
  ): CampaignMissionActionResult | undefined {
    const resourcesById = new Map<string, CampaignMissionOwnedResourceRuntimeState>();
    for (const resourceId of storedResourceIds) {
      const stored = context.state.ownedResources[resourceId];
      if (stored) resourcesById.set(resourceId, stored);
    }
    for (const resource of freshResources) {
      resourcesById.set(resource.resourceId, { ...resource, ownerToken: context.ownerToken });
    }
    if (resourcesById.size === 0) return undefined;
    const resources = [...resourcesById.values()].sort((left, right) =>
      left.resourceId.localeCompare(right.resourceId)
    );
    const leaked = this.worldAdapter?.releaseOwnedResources?.(context.ownerToken, resources, "race-lost") ?? [];
    for (const resource of resources) delete context.state.ownedResources[resource.resourceId];
    if (leaked.length > 0) {
      return {
        status: "failed",
        code: "resource-leak",
        message: `Race action leaked resources: ${[...leaked].sort().join(", ")}`
      };
    }
    return undefined;
  }

  private cancelStoredChildren(
    context: CampaignMissionActionContext,
    definition: MissionCompositeActionDefinition,
    children: readonly CampaignMissionRuntimeJsonValue[],
    excludedIndex: number,
    reason: CampaignMissionActionCancelReason = "race-lost"
  ): void {
    for (const candidate of children) {
      if (!isJsonRecord(candidate) || typeof candidate["index"] !== "number" || candidate["state"] === undefined) {
        continue;
      }
      const index = candidate["index"];
      if (index === excludedIndex || !definition.actions[index]) continue;
      this.cancel(context, definition.actions[index]!, candidate["state"], reason);
    }
  }
}

export function createCampaignActionExecutorRegistry(
  worldAdapter?: CampaignWorldActionAdapter
): CampaignActionExecutorRegistry {
  const registry = new CampaignActionExecutorRegistry();
  registerStateExecutors(registry);
  for (const kind of CAMPAIGN_ACTION_KINDS) {
    if (registry.kinds().includes(kind)) continue;
    registry.register(new DelegatingCampaignActionExecutor(kind, worldAdapter));
  }
  return registry;
}

function registerStateExecutors(registry: CampaignActionExecutorRegistry): void {
  for (const kind of ["sequence", "parallel", "race"] as const) {
    registry.register(stateExecutor(kind, () => undefined));
  }
  registry.register(
    stateExecutor("set-fact", (context, definition) => {
      if (definition.kind === "set-fact") context.state.facts[definition.factId] = definition.value;
    })
  );
  registry.register(
    stateExecutor("set-counter", (context, definition) => {
      if (definition.kind === "set-counter") context.state.counters[definition.counterId] = definition.value;
    })
  );
  registry.register(
    stateExecutor("increment-counter", (context, definition) => {
      if (definition.kind === "increment-counter") {
        context.state.counters[definition.counterId] =
          (context.state.counters[definition.counterId] ?? 0) + definition.amount;
      }
    })
  );
  for (const kind of ["add-mission-item", "consume-mission-item", "set-mission-item"] as const) {
    registry.register(
      stateExecutor(kind, (context, definition) => {
        if (definition.kind !== kind) return;
        const items = (context.state.missionItems ??= {});
        const previous = items[definition.itemId] ?? 0;
        items[definition.itemId] =
          kind === "add-mission-item"
            ? previous + definition.amount
            : kind === "consume-mission-item"
              ? Math.max(0, previous - definition.amount)
              : definition.amount;
      })
    );
  }
  registry.register(
    stateExecutor("start-timer", (context, definition) => {
      if (definition.kind === "start-timer") {
        context.state.timers[definition.timerId] = {
          durationTicks: definition.durationTicks,
          remainingTicks: definition.durationTicks,
          status: "running",
          startedAtTick: context.tick
        };
      }
    })
  );
  registry.register(
    stateExecutor("pause-timer", (context, definition) => {
      if (definition.kind === "pause-timer" && context.state.timers[definition.timerId]?.status === "running") {
        context.state.timers[definition.timerId]!.status = "paused";
      }
    })
  );
  registry.register(
    stateExecutor("cancel-timer", (context, definition) => {
      if (definition.kind === "cancel-timer" && context.state.timers[definition.timerId]) {
        context.state.timers[definition.timerId]!.status = "cancelled";
      }
    })
  );
  registry.register(
    stateExecutor("set-control-perspective", (context, definition) => {
      if (definition.kind === "set-control-perspective") {
        context.state.activeControlPlayerNumber = definition.playerNumber;
      }
    })
  );
  registry.register(new WaitTicksCampaignActionExecutor());
  registry.register(
    stateExecutor("discover-reward", (context, definition) => {
      if (definition.kind !== "discover-reward") return;
      if (!context.state.claimedRewardIds.includes(definition.rewardId)) {
        context.state.claimedRewardIds.push(definition.rewardId);
        context.state.claimedRewardIds.sort();
      }
      if (context.state.progression) {
        context.state.progression = {
          ...context.state.progression,
          pendingRewardIds: [...context.state.claimedRewardIds]
        };
      }
    })
  );
  registry.register(
    stateExecutor("set-objective-state", (context, definition) => {
      if (definition.kind === "set-objective-state") {
        context.objectiveActions?.setState(definition, context.tick);
      }
    })
  );
  registry.register(
    stateExecutor("set-objective-checklist-state", (context, definition) => {
      if (definition.kind === "set-objective-checklist-state") {
        context.objectiveActions?.setChecklistState(definition, context.tick);
      }
    })
  );
  registry.register(
    stateExecutor("set-encounter-state", (context, definition) => {
      if (definition.kind === "set-encounter-state") {
        const encounter = (context.state.encounters[definition.encounterId] ??= {
          status: "inactive",
          waveIndex: 0,
          livingSpawnedActorIds: [],
          spawnedActorOwners: {},
          spawnCursor: 0,
          deterministicBranchIds: {},
          warnedWaveIds: [],
          blockedAttempts: 0
        });
        encounter.status = definition.state;
        if (definition.state === "completed" || definition.state === "failed") {
          encounter.nextEligibleTick = undefined;
        }
        if (definition.state === "active") encounter.failureReason = undefined;
      }
    })
  );
  registry.register(
    stateExecutor("set-dialogue-state", (context, definition) => {
      if (definition.kind === "set-dialogue-state") {
        context.presentationActions?.setDialogueState(definition, context);
      }
    })
  );
  registry.register(
    stateExecutor("set-cinematic-stage", (context, definition) => {
      if (definition.kind === "set-cinematic-stage") {
        context.presentationActions?.setCinematicStage(definition, context);
      }
    })
  );
  registry.register(
    stateExecutor("request-outcome", (context, definition) => {
      if (definition.kind === "request-outcome") context.state.status = definition.outcome;
    })
  );
}

function stateExecutor(
  kind: CampaignActionKind,
  mutation: (context: CampaignMissionActionContext, definition: MissionActionDefinition) => void
): CampaignActionExecutor {
  return {
    kind,
    execute: (context, definition) => {
      mutation(context, definition);
      return { status: "completed" };
    }
  };
}

class WaitTicksCampaignActionExecutor implements CampaignActionExecutor {
  readonly kind = "wait-ticks" as const;

  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    if (definition.kind !== "wait-ticks") return wrongExecutor(this.kind, definition.kind);
    return definition.durationTicks <= 0
      ? { status: "completed" }
      : { status: "waiting", continuationState: { untilTick: context.tick + definition.durationTicks } };
  }

  resume(
    context: CampaignMissionActionContext,
    _definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult {
    const untilTick = isJsonRecord(continuationState) ? continuationState["untilTick"] : undefined;
    if (typeof untilTick !== "number") {
      return { status: "failed", code: "unresumable", message: "wait-ticks continuation has no untilTick" };
    }
    return context.tick >= untilTick ? { status: "completed" } : { status: "waiting", continuationState };
  }
}

class DelegatingCampaignActionExecutor implements CampaignActionExecutor {
  constructor(
    readonly kind: CampaignActionKind,
    private readonly adapter?: CampaignWorldActionAdapter
  ) {}

  execute(context: CampaignMissionActionContext, definition: MissionActionDefinition): CampaignMissionActionResult {
    return (
      this.adapter?.execute(context, definition) ?? {
        status: "failed",
        code: "execution-failed",
        message: `Campaign action '${definition.kind}' has no world adapter`
      }
    );
  }

  resume(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult {
    return (
      this.adapter?.resume?.(context, definition, continuationState) ?? {
        status: "failed",
        code: "unresumable",
        message: `Campaign action '${definition.id}' has no continuation adapter`
      }
    );
  }

  cancel(
    context: CampaignMissionActionContext,
    definition: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue,
    reason: CampaignMissionActionCancelReason
  ): void {
    this.adapter?.cancel?.(context, definition, continuationState, reason);
  }
}

function mergeOwnedResources(
  first: CampaignMissionActionResult,
  second: CampaignMissionActionResult
): CampaignMissionActionResult {
  return { ...second, ownedResources: collectOwnedResources([first, second]) };
}

function collectOwnedResources(
  results: readonly CampaignMissionActionResult[]
): CampaignMissionActionOwnedResource[] | undefined {
  const resources = results.flatMap((result) => result.ownedResources ?? []);
  return resources.length > 0 ? resources : undefined;
}

function wrongExecutor(expected: string, actual: string): CampaignMissionActionResult {
  return { status: "failed", code: "execution-failed", message: `Executor '${expected}' received '${actual}'` };
}

function invalidCompositeState(actionId: string): CampaignMissionActionResult {
  return { status: "failed", code: "unresumable", message: `Composite action '${actionId}' continuation is invalid` };
}

function isJsonRecord(
  value: CampaignMissionRuntimeJsonValue
): value is { readonly [key: string]: CampaignMissionRuntimeJsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toContinuationRuntimeState(
  definition: MissionActionDefinition,
  context: CampaignMissionActionContext,
  continuationState: CampaignMissionRuntimeJsonValue
): CampaignMissionActionContinuationState {
  return {
    actionId: definition.id,
    kind: definition.kind,
    ownerToken: context.ownerToken,
    scope: definition.scope ?? "phase",
    startedAtTick: context.tick,
    updatedAtTick: context.tick,
    state: continuationState
  };
}
