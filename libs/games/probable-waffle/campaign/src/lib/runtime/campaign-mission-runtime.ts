import type {
  CampaignId,
  CampaignMissionOwnedResourceRuntimeState,
  CampaignMissionRuntimeDiagnostic,
  CampaignMissionOutcome,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeJsonValue,
  CampaignMissionRuntimeState,
  CampaignMissionTriggerRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS,
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { asCampaignContentId } from "../contracts/campaign-content-id";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition } from "../contracts/mission-condition-definition";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionPhaseDefinition, MissionTransitionDefinition } from "../contracts/mission-phase-definition";
import type { MissionTriggerDefinition } from "../contracts/mission-trigger-definition";
import {
  CampaignActionRunner,
  createCampaignActionExecutorRegistry,
  toContinuationRuntimeState,
  type CampaignMissionActionCancelReason,
  type CampaignMissionActionContext,
  type CampaignMissionActionResult,
  type CampaignObjectiveActionPort,
  type CampaignPresentationActionPort,
  type CampaignWorldActionAdapter
} from "./actions/campaign-action-runtime";
import {
  CampaignConditionRuntime,
  createCampaignConditionEvaluatorRegistry,
  type CampaignWorldConditionAdapter
} from "./conditions/campaign-condition-evaluator";
import {
  createObjectiveRuntimeState,
  DefaultCampaignObjectiveService,
  type CampaignObjectiveChange
} from "./objectives/campaign-objective-service";

export interface CampaignMissionRuntimeEffect {
  readonly tick: number;
  readonly kind:
    | "action"
    | "action-waiting"
    | "action-cancelled"
    | "phase-entered"
    | "phase-completed"
    | "objective-changed"
    | "encounter-changed"
    | "outcome-requested";
  readonly sourceId: string;
  readonly detail?: CampaignMissionRuntimeJsonValue;
}

export interface CampaignMissionRuntimeResult {
  readonly state: CampaignMissionRuntimeState;
  readonly effects: readonly CampaignMissionRuntimeEffect[];
}

export interface CampaignMissionRuntimeOptions {
  readonly maxActionsPerTick?: number;
  readonly maxTransitionsPerTick?: number;
  readonly actionAdapter?: CampaignWorldActionAdapter;
  readonly conditionAdapter?: CampaignWorldConditionAdapter;
  readonly dialogue?: MissionDialogueBundle;
}

interface TickBudget {
  actions: number;
  transitions: number;
}

interface ActionSourceContext {
  readonly phaseId?: string;
  readonly triggerId?: string;
  readonly event?: CampaignMissionRuntimeEvent;
}

const DEFAULT_MAX_ACTIONS_PER_TICK = 256;
const DEFAULT_MAX_TRANSITIONS_PER_TICK = 64;
const MAX_RECENT_TRACE_ENTRIES = 128;

function runtimeJsonObject(
  value: CampaignMissionRuntimeJsonValue | undefined
): Readonly<Record<string, CampaignMissionRuntimeJsonValue>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, CampaignMissionRuntimeJsonValue>>)
    : undefined;
}

function isLocalPresentationEvent(kind: string): boolean {
  return (CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS as readonly string[]).includes(kind);
}

/** Owns the single mutable mission state while exposing cloned snapshots at integration boundaries. */
export class CampaignMissionStateStore {
  constructor(private readonly value: CampaignMissionRuntimeState) {}

  get current(): CampaignMissionRuntimeState {
    return this.value;
  }

  snapshot(): CampaignMissionRuntimeState {
    return structuredClone(this.value);
  }
}

/** Pure fixed-tick interpreter for campaign phase statecharts, triggers, timers, and objectives. */
export class CampaignMissionRuntime {
  private readonly phasesById: ReadonlyMap<string, MissionPhaseDefinition>;
  private readonly predecessorsByPhaseId: ReadonlyMap<string, readonly string[]>;
  private readonly stateStore: CampaignMissionStateStore;
  private readonly actionsById: ReadonlyMap<string, MissionActionDefinition>;
  private readonly actionRunner: CampaignActionRunner;
  private readonly conditionRuntime: CampaignConditionRuntime;
  private readonly objectiveService: DefaultCampaignObjectiveService;
  private readonly actionAdapter?: CampaignWorldActionAdapter;
  private readonly dialogue?: MissionDialogueBundle;
  private readonly maxActionsPerTick: number;
  private readonly maxTransitionsPerTick: number;

  constructor(
    private readonly campaignId: CampaignId,
    private readonly content: CampaignMissionContent,
    restoredState?: CampaignMissionRuntimeState,
    options: CampaignMissionRuntimeOptions = {}
  ) {
    this.maxActionsPerTick = options.maxActionsPerTick ?? DEFAULT_MAX_ACTIONS_PER_TICK;
    this.maxTransitionsPerTick = options.maxTransitionsPerTick ?? DEFAULT_MAX_TRANSITIONS_PER_TICK;
    this.actionAdapter = options.actionAdapter;
    this.dialogue = options.dialogue;
    this.phasesById = new Map(content.phases.map((phase) => [phase.id, phase] as const));
    this.predecessorsByPhaseId = this.buildPredecessors(content.phases);
    this.actionsById = collectMissionActions(content);
    this.actionRunner = new CampaignActionRunner(
      createCampaignActionExecutorRegistry(options.actionAdapter),
      options.actionAdapter
    );
    this.conditionRuntime = new CampaignConditionRuntime(
      createCampaignConditionEvaluatorRegistry(options.conditionAdapter)
    );
    const state = restoredState
      ? this.validateAndCloneRestoredState(restoredState)
      : createCampaignMissionRuntimeState(campaignId, content);
    this.stateStore = new CampaignMissionStateStore(state);
    this.objectiveService = new DefaultCampaignObjectiveService(state, content.objectives);
    try {
      this.actionAdapter?.restoreOwnedResources?.(Object.values(state.ownedResources));
    } catch (error) {
      this.fail(
        "resource-leak",
        `Failed to restore owned resources: ${deterministicErrorMessage(error)}`,
        state.integrity.lastProcessedTick
      );
    }
    this.canonicalizeState();
  }

  get state(): Readonly<CampaignMissionRuntimeState> {
    return this.stateStore.current;
  }

  snapshot(): CampaignMissionRuntimeState {
    return this.stateStore.snapshot();
  }

  cancel(reason: CampaignMissionActionCancelReason = "mission-ended"): CampaignMissionRuntimeResult {
    const effects: CampaignMissionRuntimeEffect[] = [];
    this.cancelOwnedByPrefix("", reason, this.stateStore.current.integrity.lastProcessedTick, effects);
    this.objectiveService.destroy();
    return this.result(effects);
  }

  /** Executes initial phase entry exactly once, after scene actors have been indexed. */
  start(tick: number): CampaignMissionRuntimeResult {
    const state = this.stateStore.current;
    if (state.initialized) return this.result([]);

    state.initialized = true;
    state.status = "running";
    state.integrity.lastProcessedTick = tick;
    for (const timer of Object.values(state.timers)) {
      if (timer.status === "running" && timer.startedAtTick === undefined) timer.startedAtTick = tick;
    }
    const effects: CampaignMissionRuntimeEffect[] = [];
    const budget: TickBudget = { actions: 0, transitions: 0 };
    for (const phaseId of [...state.activePhaseIds].sort()) {
      const phase = this.requirePhase(phaseId, tick);
      if (!phase || !this.applyActions(phase.entryActions, tick, budget, effects, { phaseId })) break;
      effects.push({ tick, kind: "phase-entered", sourceId: phaseId });
    }
    if (state.status === "running") {
      this.settleTick(tick, budget, effects, false);
    }
    this.finishTick(budget);
    return this.result(effects);
  }

  /** Adds a deterministic event to the persisted queue; sequence is assigned when omitted. */
  enqueueEvent(event: Omit<CampaignMissionRuntimeEvent, "sequence"> & { readonly sequence?: number }): number {
    const state = this.stateStore.current;
    const sequence = event.sequence ?? state.integrity.lastQueuedEventSequence + 1;
    state.integrity.lastQueuedEventSequence = Math.max(state.integrity.lastQueuedEventSequence, sequence);
    const queuedEvent = { ...event, sequence } as CampaignMissionRuntimeEvent;
    this.applyPresentationEvent(queuedEvent);
    state.pendingEvents.push(queuedEvent);
    this.canonicalizeState();
    return sequence;
  }

  /** Advances through every missing fixed tick so skip/fast-forward matches uninterrupted execution. */
  advanceTo(tick: number): CampaignMissionRuntimeResult {
    const effects: CampaignMissionRuntimeEffect[] = [];
    while (this.stateStore.current.status === "running" && this.stateStore.current.integrity.lastProcessedTick < tick) {
      effects.push(...this.processTick(this.stateStore.current.integrity.lastProcessedTick + 1));
    }
    return this.result(effects);
  }

  /** Claims a terminal outcome once; the dispatch marker is part of persisted mission state. */
  claimOutcome(): Extract<CampaignMissionOutcome, "victory" | "defeat"> | undefined {
    const state = this.stateStore.current;
    if (state.integrity.outcomeDispatched || (state.status !== "victory" && state.status !== "defeat")) {
      return undefined;
    }
    state.integrity.outcomeDispatched = true;
    return state.status;
  }

  private processTick(tick: number): CampaignMissionRuntimeEffect[] {
    const state = this.stateStore.current;
    const effects: CampaignMissionRuntimeEffect[] = [];
    const budget: TickBudget = { actions: 0, transitions: 0 };
    if (!this.processContinuations(tick, budget, effects)) {
      state.integrity.lastProcessedTick = tick;
      this.finishTick(budget);
      return effects;
    }
    this.advanceTimers(tick);

    this.settleTick(tick, budget, effects, true);

    state.integrity.lastProcessedTick = tick;
    this.finishTick(budget);
    return effects;
  }

  private settleTick(
    tick: number,
    budget: TickBudget,
    effects: CampaignMissionRuntimeEffect[],
    pollConditions: boolean
  ): void {
    if (!this.drainReadyEvents(tick, budget, effects)) return;
    if (pollConditions && !this.processTriggers(tick, budget, effects)) return;
    while (this.stateStore.current.status === "running") {
      this.evaluateObjectives(tick, effects);
      this.drainTransitions(tick, budget, effects);
      if (!this.hasReadyEvent(tick) || !this.drainReadyEvents(tick, budget, effects)) return;
    }
  }

  private drainReadyEvents(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): boolean {
    while (this.hasReadyEvent(tick) && this.stateStore.current.status === "running") {
      const state = this.stateStore.current;
      const readyEvents = state.pendingEvents.filter((event) => event.tick <= tick).sort(compareRuntimeEvents);
      state.pendingEvents = state.pendingEvents.filter((event) => event.tick > tick);
      for (const event of readyEvents) {
        if (isLocalPresentationEvent(event.kind)) continue;
        if (!this.processTriggers(tick, budget, effects, event)) return false;
      }
    }
    return this.stateStore.current.status === "running";
  }

  private hasReadyEvent(tick: number): boolean {
    return this.stateStore.current.pendingEvents.some((event) => event.tick <= tick);
  }

  private processTriggers(
    tick: number,
    budget: TickBudget,
    effects: CampaignMissionRuntimeEffect[],
    event?: CampaignMissionRuntimeEvent
  ): boolean {
    const triggers = this.activePhases()
      .flatMap((phase) => phase.triggers.map((trigger) => ({ phase, trigger })))
      .filter(({ trigger }) => (event ? trigger.kind === "event" : trigger.kind === "condition"))
      .filter(({ trigger }) => !event || !trigger.eventKinds?.length || trigger.eventKinds.includes(event.kind))
      .sort((left, right) => comparePriorityAndId(left.trigger, right.trigger));

    for (const { phase, trigger } of triggers) {
      const conditionMet = this.evaluateCondition(trigger.condition, event);
      if (!this.shouldFireTrigger(trigger, conditionMet, tick)) continue;
      const runtimeState = this.getTriggerState(trigger);
      runtimeState.firedCount += 1;
      runtimeState.lastFiredTick = tick;
      if (trigger.firing.kind === "once") addSortedUnique(this.stateStore.current.claimedTriggerIds, trigger.id);
      if (
        !this.applyActions(trigger.actions, tick, budget, effects, {
          phaseId: phase.id,
          triggerId: trigger.id,
          event
        })
      ) {
        return false;
      }
      if (this.stateStore.current.status !== "running") return false;
    }
    return true;
  }

  private shouldFireTrigger(trigger: MissionTriggerDefinition, conditionMet: boolean, tick: number): boolean {
    const runtimeState = this.getTriggerState(trigger);
    const wasMet = runtimeState.lastCondition;
    runtimeState.lastCondition = conditionMet;
    if (!conditionMet) return false;

    switch (trigger.firing.kind) {
      case "once":
        return runtimeState.firedCount === 0;
      case "repeatable":
        return (
          runtimeState.lastFiredTick === undefined || tick - runtimeState.lastFiredTick >= trigger.firing.cooldownTicks
        );
      case "edge":
        return !wasMet;
      case "while":
        return (
          runtimeState.lastFiredTick === undefined || tick - runtimeState.lastFiredTick >= trigger.firing.cadenceTicks
        );
    }
  }

  private getTriggerState(trigger: MissionTriggerDefinition): CampaignMissionTriggerRuntimeState {
    const states = this.stateStore.current.triggerStates;
    return (states[trigger.id] ??= { firedCount: 0, lastCondition: false });
  }

  private evaluateObjectives(tick: number, effects: CampaignMissionRuntimeEffect[]): void {
    this.objectiveService.evaluate(tick, { evaluate: (condition) => this.evaluateCondition(condition) });
    this.publishObjectiveChanges(this.objectiveService.drainChanges(), effects);
  }

  private drainTransitions(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): void {
    let transitioned = true;
    while (transitioned && this.stateStore.current.status === "running") {
      transitioned = this.processTransitionWave(tick, budget, effects);
    }
  }

  private processTransitionWave(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): boolean {
    const candidates = this.activePhases()
      .flatMap((phase) => {
        const matches = phase.transitions.filter((transition) => this.evaluateCondition(transition.condition));
        const selected = phase.mode === "sequential" ? matches.sort(comparePriorityAndId).slice(0, 1) : matches;
        return selected.map((transition) => ({ phase, transition }));
      })
      .sort((left, right) => comparePriorityAndId(left.transition, right.transition));
    if (candidates.length === 0) return false;

    const bySource = new Map<string, { phase: MissionPhaseDefinition; transitions: MissionTransitionDefinition[] }>();
    for (const candidate of candidates) {
      const entry = bySource.get(candidate.phase.id) ?? { phase: candidate.phase, transitions: [] };
      entry.transitions.push(candidate.transition);
      bySource.set(candidate.phase.id, entry);
    }

    let transitioned = false;
    for (const source of [...bySource.values()].sort((left, right) => left.phase.id.localeCompare(right.phase.id))) {
      if (!this.stateStore.current.activePhaseIds.includes(source.phase.id)) continue;
      if (!this.consumeTransitionBudget(source.transitions.length, tick, source.phase.id, budget)) return transitioned;
      if (!this.cancelOwnedByPhase(source.phase.id, "phase-exited", tick, effects)) return transitioned;
      if (!this.applyActions(source.phase.exitActions, tick, budget, effects, { phaseId: source.phase.id })) {
        return transitioned;
      }
      removeValue(this.stateStore.current.activePhaseIds, source.phase.id);
      addSortedUnique(this.stateStore.current.completedPhaseIds, source.phase.id);
      effects.push({ tick, kind: "phase-completed", sourceId: source.phase.id });
      transitioned = true;

      for (const transition of source.transitions.sort(comparePriorityAndId)) {
        if (!this.applyActions(transition.actions, tick, budget, effects, { phaseId: source.phase.id })) {
          return transitioned;
        }
        for (const targetId of transition.targetPhaseIds)
          addSortedUnique(this.stateStore.current.pendingPhaseIds, targetId);
      }
      if (!this.activateReadyPhases(tick, budget, effects)) return transitioned;
    }
    return transitioned;
  }

  private activateReadyPhases(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): boolean {
    const state = this.stateStore.current;
    for (const targetId of [...state.pendingPhaseIds].sort()) {
      const predecessors = this.predecessorsByPhaseId.get(targetId) ?? [];
      const joinReady = predecessors.length <= 1 || predecessors.every((id) => state.completedPhaseIds.includes(id));
      if (!joinReady) continue;
      removeValue(state.pendingPhaseIds, targetId);
      if (state.completedPhaseIds.includes(targetId)) {
        this.fail(
          "invalid-runtime-state",
          `Transition cycle attempted to reactivate phase '${targetId}'`,
          tick,
          targetId
        );
        return false;
      }
      if (state.activePhaseIds.includes(targetId)) continue;
      const phase = this.requirePhase(targetId, tick);
      if (!phase) return false;
      addSortedUnique(state.activePhaseIds, targetId);
      if (!this.applyActions(phase.entryActions, tick, budget, effects, { phaseId: targetId })) return false;
      effects.push({ tick, kind: "phase-entered", sourceId: targetId });
    }
    return true;
  }

  private applyActions(
    actions: readonly MissionActionDefinition[],
    tick: number,
    budget: TickBudget,
    effects: CampaignMissionRuntimeEffect[],
    source: ActionSourceContext
  ): boolean {
    for (const action of actions) {
      const actionCost = this.presentationActionCost(action, tick);
      if (actionCost === undefined) return false;
      if (budget.actions + actionCost > this.maxActionsPerTick) {
        this.fail("action-budget-exceeded", `Action budget ${this.maxActionsPerTick} exceeded`, tick, action.id);
        return false;
      }
      budget.actions += actionCost;
      this.stateStore.current.integrity.processedActionCount += actionCost;
      this.applyAction(action, tick, effects, source);
      if (this.stateStore.current.status !== "running") return false;
    }
    return true;
  }

  private applyAction(
    action: MissionActionDefinition,
    tick: number,
    effects: CampaignMissionRuntimeEffect[],
    source: ActionSourceContext
  ): void {
    const context = this.createActionContext(action, tick, source);
    const result = this.executeActionSafely(context, action);
    this.publishObjectiveChanges(this.objectiveService.drainChanges(), effects);
    this.handleActionResult(action, context, result, effects);
  }

  private evaluateCondition(condition: MissionConditionDefinition, event?: CampaignMissionRuntimeEvent): boolean {
    return this.conditionRuntime.evaluate({ state: this.stateStore.current, event }, condition);
  }

  private advanceTimers(tick: number): void {
    for (const [timerId, timer] of Object.entries(this.stateStore.current.timers)) {
      if (timer.status !== "running") continue;
      timer.remainingTicks = Math.max(0, timer.remainingTicks - 1);
      if (timer.remainingTicks === 0) {
        timer.status = "elapsed";
        this.enqueueEvent({ tick, kind: "timer.elapsed", sourceId: timerId, payload: { timerId } });
      }
    }
  }

  private processContinuations(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): boolean {
    const continuations = Object.values(this.stateStore.current.actionContinuations).sort(
      (left, right) => left.ownerToken.localeCompare(right.ownerToken) || left.actionId.localeCompare(right.actionId)
    );
    for (const continuation of continuations) {
      const action = this.actionsById.get(continuation.actionId);
      if (!action) {
        this.fail(
          "unresumable-action",
          `Waiting action '${continuation.actionId}' no longer exists in mission content`,
          tick,
          continuation.actionId,
          { actionId: continuation.actionId }
        );
        return false;
      }
      const actionCost = this.presentationActionCost(action, tick);
      if (actionCost === undefined) return false;
      if (budget.actions + actionCost > this.maxActionsPerTick) {
        this.fail("action-budget-exceeded", `Action budget ${this.maxActionsPerTick} exceeded`, tick, action.id);
        return false;
      }
      budget.actions += actionCost;
      this.stateStore.current.integrity.processedActionCount += actionCost;
      const source = sourceFromOwnerToken(continuation.ownerToken);
      const context: CampaignMissionActionContext = {
        tick,
        state: this.stateStore.current,
        ownerToken: continuation.ownerToken,
        phaseId: source.phaseId,
        triggerId: source.triggerId,
        objectiveActions: this.objectiveActionPort(),
        presentationActions: this.presentationActionPort()
      };
      const result = this.resumeActionSafely(context, action, continuation.state);
      this.publishObjectiveChanges(this.objectiveService.drainChanges(), effects);
      this.handleActionResult(action, context, result, effects, continuation.startedAtTick);
      if (this.stateStore.current.status !== "running") return false;
    }
    return true;
  }

  private createActionContext(
    action: MissionActionDefinition,
    tick: number,
    source: ActionSourceContext
  ): CampaignMissionActionContext {
    const scope = action.scope ?? "phase";
    const ownerToken =
      scope === "mission" || !source.phaseId
        ? `mission:${this.content.id}:${action.id}`
        : `phase:${source.phaseId}:${source.triggerId ?? "direct"}:${action.id}`;
    return {
      tick,
      state: this.stateStore.current,
      ownerToken,
      phaseId: source.phaseId,
      triggerId: source.triggerId,
      event: source.event,
      objectiveActions: this.objectiveActionPort(),
      presentationActions: this.presentationActionPort()
    };
  }

  private handleActionResult(
    action: MissionActionDefinition,
    context: CampaignMissionActionContext,
    result: CampaignMissionActionResult,
    effects: CampaignMissionRuntimeEffect[],
    startedAtTick = context.tick
  ): void {
    this.recordOwnedResources(context.ownerToken, result, context.tick, action.id);
    if (this.stateStore.current.status === "failed") return;

    if (result.status === "failed") {
      if (result.code === "missing-reference") {
        const policy = action.missingReferencePolicy ?? "fail-mission";
        if (policy === "skip") {
          delete this.stateStore.current.actionContinuations[action.id];
          effects.push({
            tick: context.tick,
            kind: "action",
            sourceId: action.id,
            detail: { kind: action.kind, status: "skipped", reason: result.message }
          });
          return;
        }
        if (policy === "wait") {
          this.storeContinuation(
            action,
            context,
            result.continuationState ?? { retryMissingReference: true },
            startedAtTick,
            effects
          );
          return;
        }
        if (policy === "fallback" && action.fallbackAction) {
          effects.push({
            tick: context.tick,
            kind: "action",
            sourceId: action.id,
            detail: { kind: action.kind, status: "fallback", reason: result.message }
          });
          const fallbackContext = {
            ...context,
            ownerToken: `${context.ownerToken}:fallback:${action.fallbackAction.id}`
          };
          const fallbackResult = this.executeActionSafely(fallbackContext, action.fallbackAction);
          this.publishObjectiveChanges(this.objectiveService.drainChanges(), effects);
          this.handleActionResult(action.fallbackAction, fallbackContext, fallbackResult, effects);
          return;
        }
      }
      const code =
        result.code === "missing-reference"
          ? "missing-reference"
          : result.code === "unresumable"
            ? "unresumable-action"
            : result.code === "resource-leak"
              ? "resource-leak"
              : "action-failed";
      this.fail(code, result.message, context.tick, action.id, {
        phaseId: context.phaseId,
        triggerId: context.triggerId,
        actionId: action.id
      });
      return;
    }

    if (result.status === "waiting") {
      this.storeContinuation(action, context, result.continuationState, startedAtTick, effects);
      return;
    }

    delete this.stateStore.current.actionContinuations[action.id];
    effects.push({
      tick: context.tick,
      kind: "action",
      sourceId: action.id,
      detail: { kind: action.kind, status: result.status }
    });
    if (action.kind === "set-encounter-state") {
      effects.push({
        tick: context.tick,
        kind: "encounter-changed",
        sourceId: action.encounterId,
        detail: action.state
      });
      this.enqueueEvent({
        tick: context.tick,
        kind: "encounter.changed",
        sourceId: action.encounterId,
        payload: { encounterId: action.encounterId, state: action.state }
      });
    } else if (action.kind === "request-outcome") {
      effects.push({
        tick: context.tick,
        kind: "outcome-requested",
        sourceId: action.reasonId,
        detail: action.outcome
      });
      this.cancelOwnedByPrefix("", "mission-ended", context.tick, effects);
    }
  }

  private storeContinuation(
    action: MissionActionDefinition,
    context: CampaignMissionActionContext,
    continuationState: CampaignMissionRuntimeJsonValue,
    startedAtTick: number,
    effects: CampaignMissionRuntimeEffect[]
  ): void {
    this.stateStore.current.actionContinuations[action.id] = {
      ...toContinuationRuntimeState(action, context, continuationState),
      startedAtTick,
      updatedAtTick: context.tick
    };
    effects.push({
      tick: context.tick,
      kind: "action-waiting",
      sourceId: action.id,
      detail: { kind: action.kind, ownerToken: context.ownerToken }
    });
  }

  private executeActionSafely(
    context: CampaignMissionActionContext,
    action: MissionActionDefinition
  ): CampaignMissionActionResult {
    try {
      return this.actionRunner.execute(context, this.expandPresentationAction(action));
    } catch (error) {
      return {
        status: "failed",
        code: "execution-failed",
        message: `Action '${action.id}' threw: ${deterministicErrorMessage(error)}`
      };
    }
  }

  private presentationActionCost(action: MissionActionDefinition, tick: number): number | undefined {
    try {
      return countActionNodes(this.expandPresentationAction(action));
    } catch (error) {
      this.fail("action-failed", error instanceof Error ? error.message : String(error), tick, action.id, {
        actionId: action.id
      });
      return undefined;
    }
  }

  private objectiveActionPort(): CampaignObjectiveActionPort {
    return {
      setState: (definition, tick) => {
        if (definition.state === "active") this.objectiveService.reveal(definition.objectiveId, tick);
        else if (definition.state === "completed") this.objectiveService.complete(definition.objectiveId, tick);
        else if (definition.state === "failed") {
          this.objectiveService.fail(definition.objectiveId, tick, definition.reasonId);
        } else {
          this.objectiveService.markImpossible(definition.objectiveId, tick, definition.reasonId);
        }
      },
      setChecklistState: (definition, tick) => {
        this.objectiveService.setChecklistState(definition.objectiveId, definition.checklistId, definition.state, tick);
      }
    };
  }

  private presentationActionPort(): CampaignPresentationActionPort {
    return {
      setDialogueState: (definition, context) => {
        const existing = context.state.dialoguePresentations[context.ownerToken];
        if (definition.state === "presenting") {
          context.state.dialoguePresentations[context.ownerToken] = {
            lineId: definition.lineId,
            ownerToken: context.ownerToken,
            status: "presenting",
            startedAtTick: context.tick,
            updatedAtTick: context.tick
          };
          context.state.dialogueHistory.push({
            sequence: (context.state.dialogueHistory.at(-1)?.sequence ?? 0) + 1,
            tick: context.tick,
            lineId: definition.lineId,
            ownerToken: context.ownerToken
          });
          return;
        }
        if (!existing || existing.status === "acknowledged") return;
        existing.status = "acknowledged";
        existing.updatedAtTick = context.tick;
        existing.acknowledgedAtTick = context.tick;
      },
      setCinematicStage: (definition, context) => {
        const existing = context.state.cinematics[definition.cinematicId];
        if (definition.stage === "prelude") {
          if (
            context.state.activeCinematicId &&
            context.state.activeCinematicId !== definition.cinematicId &&
            !context.state.cinematics[context.state.activeCinematicId]?.finalized
          ) {
            throw new Error(`Cinematic '${context.state.activeCinematicId}' is already active`);
          }
          context.state.cinematics[definition.cinematicId] = {
            cinematicId: definition.cinematicId,
            ownerToken: context.ownerToken,
            stage: "prelude",
            startedAtTick: context.tick,
            updatedAtTick: context.tick,
            finalizeRequested: false,
            finalized: false,
            skipped: false
          };
          context.state.activeCinematicId = definition.cinematicId;
          return;
        }
        if (!existing) throw new Error(`Cinematic '${definition.cinematicId}' has not entered its prelude`);
        existing.stage = definition.stage;
        existing.updatedAtTick = context.tick;
        if (definition.stage === "completed") {
          existing.finalized = true;
          if (context.state.activeCinematicId === definition.cinematicId) delete context.state.activeCinematicId;
        }
      }
    };
  }

  private publishObjectiveChanges(
    changes: readonly CampaignObjectiveChange[],
    effects: CampaignMissionRuntimeEffect[]
  ): void {
    for (const change of changes) {
      effects.push({
        tick: change.tick,
        kind: "objective-changed",
        sourceId: change.objectiveId,
        detail: {
          kind: change.kind,
          previousStatus: change.previousStatus,
          status: change.status,
          earlyCompleted: change.earlyCompleted,
          announce: change.announce,
          checklistChanges: change.checklistChanges.map((item) => ({ ...item }))
        }
      });
      if (change.kind === "status" && change.status === "completed") {
        const objective = this.content.objectives.find((candidate) => candidate.id === change.objectiveId);
        for (const rewardId of objective?.rewardIds ?? [])
          addSortedUnique(this.stateStore.current.claimedRewardIds, rewardId);
      }
      const checklist = change.checklistChanges[0];
      this.enqueueEvent({
        tick: change.tick,
        kind: "objective.changed",
        sourceId: change.objectiveId,
        payload: {
          objectiveId: change.objectiveId,
          state: change.status,
          ...(checklist
            ? {
                checklistId: checklist.checklistId,
                checklistState: checklist.status,
                ...(checklist.current !== undefined ? { current: checklist.current } : {}),
                ...(checklist.target !== undefined ? { target: checklist.target } : {})
              }
            : {})
        }
      });
    }
  }

  private resumeActionSafely(
    context: CampaignMissionActionContext,
    action: MissionActionDefinition,
    continuationState: CampaignMissionRuntimeJsonValue
  ): CampaignMissionActionResult {
    try {
      return this.actionRunner.resume(context, this.expandPresentationAction(action), continuationState);
    } catch (error) {
      return {
        status: "failed",
        code: "execution-failed",
        message: `Action '${action.id}' resume threw: ${deterministicErrorMessage(error)}`
      };
    }
  }

  private recordOwnedResources(
    ownerToken: string,
    result: CampaignMissionActionResult,
    tick: number,
    actionId: string
  ): void {
    for (const resource of result.ownedResources ?? []) {
      const existing = this.stateStore.current.ownedResources[resource.resourceId];
      if (existing && existing.ownerToken !== ownerToken) {
        this.fail(
          "resource-leak",
          `Owned resource '${resource.resourceId}' is already registered to '${existing.ownerToken}'`,
          tick,
          actionId,
          { actionId }
        );
        return;
      }
      this.stateStore.current.ownedResources[resource.resourceId] = {
        resourceId: resource.resourceId,
        kind: resource.kind,
        ownerToken,
        state: resource.state
      };
    }
  }

  private cancelOwnedByPhase(
    phaseId: string,
    reason: CampaignMissionActionCancelReason,
    tick: number,
    effects: CampaignMissionRuntimeEffect[]
  ): boolean {
    return this.cancelOwnedByPrefix(`phase:${phaseId}:`, reason, tick, effects);
  }

  private cancelOwnedByPrefix(
    ownerPrefix: string,
    reason: CampaignMissionActionCancelReason,
    tick: number,
    effects: CampaignMissionRuntimeEffect[]
  ): boolean {
    const continuations = Object.values(this.stateStore.current.actionContinuations)
      .filter((continuation) => continuation.ownerToken.startsWith(ownerPrefix))
      .sort(
        (left, right) => left.ownerToken.localeCompare(right.ownerToken) || left.actionId.localeCompare(right.actionId)
      );
    for (const continuation of continuations) {
      const action = this.actionsById.get(continuation.actionId);
      if (action) {
        const source = sourceFromOwnerToken(continuation.ownerToken);
        try {
          this.actionRunner.cancel(
            {
              tick,
              state: this.stateStore.current,
              ownerToken: continuation.ownerToken,
              phaseId: source.phaseId,
              triggerId: source.triggerId,
              objectiveActions: this.objectiveActionPort(),
              presentationActions: this.presentationActionPort()
            },
            this.expandPresentationAction(action),
            continuation.state,
            reason
          );
        } catch (error) {
          this.fail(
            "action-failed",
            `Action '${action.id}' cancellation threw: ${deterministicErrorMessage(error)}`,
            tick,
            action.id,
            { phaseId: source.phaseId, triggerId: source.triggerId, actionId: action.id }
          );
          return false;
        }
      }
      delete this.stateStore.current.actionContinuations[continuation.actionId];
      effects.push({ tick, kind: "action-cancelled", sourceId: continuation.actionId, detail: reason });
    }

    const resourcesByOwner = new Map<string, CampaignMissionOwnedResourceRuntimeState[]>();
    for (const resource of Object.values(this.stateStore.current.ownedResources)) {
      if (!resource.ownerToken.startsWith(ownerPrefix)) continue;
      const resources = resourcesByOwner.get(resource.ownerToken) ?? [];
      resources.push(resource);
      resourcesByOwner.set(resource.ownerToken, resources);
    }
    for (const [ownerToken, resources] of [...resourcesByOwner].sort(([left], [right]) => left.localeCompare(right))) {
      let leaked: readonly string[];
      try {
        leaked = this.actionAdapter?.releaseOwnedResources?.(ownerToken, resources, reason) ?? [];
      } catch (error) {
        leaked = resources.map((resource) => resource.resourceId);
        this.fail(
          "resource-leak",
          `Owned resource cleanup threw for '${ownerToken}': ${deterministicErrorMessage(error)}`,
          tick,
          ownerToken
        );
      }
      for (const resource of resources) delete this.stateStore.current.ownedResources[resource.resourceId];
      if (this.stateStore.current.status === "failed") return false;
      if (leaked.length > 0) {
        this.fail(
          "resource-leak",
          `Owned resources failed cleanup: ${[...leaked].sort().join(", ")}`,
          tick,
          ownerToken
        );
        return false;
      }
    }
    return true;
  }

  private activePhases(): MissionPhaseDefinition[] {
    return this.stateStore.current.activePhaseIds
      .map((id) => this.phasesById.get(id))
      .filter((phase): phase is MissionPhaseDefinition => phase !== undefined)
      .sort(compareById);
  }

  private consumeTransitionBudget(count: number, tick: number, sourceId: string, budget: TickBudget): boolean {
    if (budget.transitions + count > this.maxTransitionsPerTick) {
      this.fail(
        "transition-budget-exceeded",
        `Transition budget ${this.maxTransitionsPerTick} exceeded`,
        tick,
        sourceId
      );
      return false;
    }
    budget.transitions += count;
    this.stateStore.current.integrity.processedTransitionCount += count;
    return true;
  }

  private requirePhase(id: string, tick: number): MissionPhaseDefinition | undefined {
    const phase = this.phasesById.get(id);
    if (!phase) this.fail("invalid-runtime-state", `Unknown mission phase '${id}'`, tick, id);
    return phase;
  }

  private fail(
    code: CampaignMissionRuntimeDiagnostic["code"],
    message: string,
    tick: number,
    sourceId?: string,
    context: Pick<CampaignMissionRuntimeDiagnostic, "phaseId" | "triggerId" | "actionId"> = {}
  ): void {
    const state = this.stateStore.current;
    state.status = "failed";
    state.integrity.diagnostic = { code, message, tick, sourceId, ...context };
  }

  private finishTick(budget: TickBudget): void {
    const integrity = this.stateStore.current.integrity;
    integrity.lastTickActionCount = budget.actions;
    integrity.lastTickTransitionCount = budget.transitions;
    this.canonicalizeState();
  }

  private canonicalizeState(): void {
    const state = this.stateStore.current;
    state.activePhaseIds.sort();
    state.completedPhaseIds.sort();
    state.pendingPhaseIds.sort();
    state.claimedTriggerIds.sort();
    state.claimedRewardIds.sort();
    state.pendingEvents.sort(compareRuntimeEvents);
    state.facts = sortRecord(state.facts);
    state.counters = sortRecord(state.counters);
    state.timers = sortRecord(state.timers);
    state.objectives = sortRecord(state.objectives);
    for (const objective of Object.values(state.objectives)) {
      objective.checklist = sortRecord(objective.checklist);
      objective.announcedStatuses.sort();
    }
    state.missionMessageHistory.sort((left, right) => left.sequence - right.sequence);
    state.dialoguePresentations = sortRecord(state.dialoguePresentations);
    state.dialogueHistory.sort((left, right) => left.sequence - right.sequence);
    state.cinematics = sortRecord(state.cinematics);
    state.encounters = sortRecord(state.encounters);
    state.triggerStates = sortRecord(state.triggerStates);
    state.actionContinuations = sortRecord(state.actionContinuations);
    state.ownedResources = sortRecord(state.ownedResources);
  }

  private result(effects: readonly CampaignMissionRuntimeEffect[]): CampaignMissionRuntimeResult {
    const integrity = this.stateStore.current.integrity;
    integrity.recentTrace.push(...effects.map((effect) => ({ ...effect })));
    const diagnostic = integrity.diagnostic;
    const lastTrace = integrity.recentTrace.at(-1);
    if (
      diagnostic &&
      (lastTrace?.kind !== "diagnostic" ||
        lastTrace.tick !== diagnostic.tick ||
        lastTrace.sourceId !== (diagnostic.sourceId ?? diagnostic.code))
    ) {
      integrity.recentTrace.push({
        tick: diagnostic.tick,
        kind: "diagnostic",
        sourceId: diagnostic.sourceId ?? diagnostic.code,
        detail: diagnostic.message
      });
    }
    this.trimTrace();
    this.canonicalizeState();
    return { state: this.snapshot(), effects };
  }

  private validateAndCloneRestoredState(restored: CampaignMissionRuntimeState): CampaignMissionRuntimeState {
    if (
      restored.schemaVersion !== CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION ||
      restored.campaignId !== this.campaignId ||
      restored.missionId !== this.content.id ||
      restored.missionRevision !== this.content.revision
    ) {
      throw new Error(
        `Campaign mission runtime identity mismatch for ${this.campaignId}/${this.content.id}@${this.content.revision}`
      );
    }
    return structuredClone(restored);
  }

  private applyPresentationEvent(event: CampaignMissionRuntimeEvent): void {
    if (event.kind === "dialogue.presented") {
      const payload = runtimeJsonObject(event.payload);
      const lineId = payload?.lineId;
      const ownerToken = payload?.ownerToken;
      if (typeof lineId !== "string" || typeof ownerToken !== "string") return;
      if (this.stateStore.current.dialoguePresentations[ownerToken]) return;
      this.stateStore.current.dialoguePresentations[ownerToken] = {
        lineId,
        ownerToken,
        status: "presenting",
        startedAtTick: event.tick,
        updatedAtTick: event.tick
      };
      this.stateStore.current.dialogueHistory.push({
        sequence: (this.stateStore.current.dialogueHistory.at(-1)?.sequence ?? 0) + 1,
        tick: event.tick,
        lineId,
        ownerToken
      });
      return;
    }
    if (event.kind === "dialogue.acknowledged") {
      const payload = runtimeJsonObject(event.payload);
      const lineId = payload?.lineId;
      const requestedOwnerToken = payload?.ownerToken;
      if (
        typeof lineId !== "string" ||
        (requestedOwnerToken !== undefined && typeof requestedOwnerToken !== "string")
      ) {
        return;
      }
      const ownerToken = requestedOwnerToken ?? this.findPresentingDialogueOwner(lineId);
      if (!ownerToken) return;
      const presentation = this.stateStore.current.dialoguePresentations[ownerToken];
      if (!presentation || presentation.status === "acknowledged") return;
      presentation.status = "acknowledged";
      presentation.updatedAtTick = event.tick;
      presentation.acknowledgedAtTick = event.tick;
      return;
    }
    if (event.kind === "cinematic.finished") {
      const payload = runtimeJsonObject(event.payload);
      const cinematicId = payload?.cinematicId;
      const skipped = payload?.skipped;
      if (typeof cinematicId !== "string" || typeof skipped !== "boolean") return;
      const cinematic = this.stateStore.current.cinematics[cinematicId];
      if (!cinematic || cinematic.finalizeRequested || cinematic.finalized) return;
      cinematic.stage = "finalizing";
      cinematic.updatedAtTick = event.tick;
      cinematic.finishedAtTick = event.tick;
      cinematic.finalizeRequested = true;
      cinematic.skipped = skipped;
      return;
    }
    if (event.kind === "cinematic.cue") {
      const payload = runtimeJsonObject(event.payload);
      const cinematicId = payload?.cinematicId;
      const cueIndex = payload?.cueIndex;
      if (typeof cinematicId !== "string" || typeof cueIndex !== "number" || !Number.isInteger(cueIndex)) return;
      const cinematic = this.stateStore.current.cinematics[cinematicId];
      if (!cinematic || cinematic.finalized) return;
      cinematic.presentationCueIndex = cueIndex;
      cinematic.updatedAtTick = event.tick;
    }
  }

  private findPresentingDialogueOwner(lineId: string): string | undefined {
    return Object.values(this.stateStore.current.dialoguePresentations)
      .filter((presentation) => presentation.lineId === lineId && presentation.status === "presenting")
      .sort(
        (left, right) => right.startedAtTick - left.startedAtTick || right.ownerToken.localeCompare(left.ownerToken)
      )[0]?.ownerToken;
  }

  private expandPresentationAction(
    action: MissionActionDefinition,
    cinematicStack: readonly string[] = []
  ): MissionActionDefinition {
    const fallbackAction = action.fallbackAction
      ? this.expandPresentationAction(action.fallbackAction, cinematicStack)
      : undefined;
    if (action.kind === "sequence" || action.kind === "parallel" || action.kind === "race") {
      return {
        ...action,
        ...(fallbackAction ? { fallbackAction } : {}),
        actions: action.actions.map((child) => this.expandPresentationAction(child, cinematicStack))
      };
    }
    if (action.kind === "start-dialogue" && !action.presentationOnly) {
      const presentation = {
        ...action,
        id: syntheticActionId(action.id, "present"),
        presentationOnly: true,
        fallbackAction: undefined
      } satisfies MissionActionDefinition;
      return {
        id: action.id,
        kind: "sequence",
        ...(action.scope ? { scope: action.scope } : {}),
        ...(action.missingReferencePolicy ? { missingReferencePolicy: action.missingReferencePolicy } : {}),
        ...(fallbackAction ? { fallbackAction } : {}),
        actions: [
          {
            id: syntheticActionId(action.id, "mark-presenting"),
            kind: "set-dialogue-state",
            lineId: action.lineId,
            state: "presenting"
          },
          presentation,
          ...(action.waitForAcknowledgement
            ? [
                {
                  id: syntheticActionId(action.id, "mark-acknowledged"),
                  kind: "set-dialogue-state" as const,
                  lineId: action.lineId,
                  state: "acknowledged" as const
                }
              ]
            : [])
        ]
      };
    }
    if (action.kind === "start-cinematic" && !action.presentationOnly) {
      if (cinematicStack.includes(action.cinematicId)) {
        throw new Error(`Cinematic action cycle: ${[...cinematicStack, action.cinematicId].join(" -> ")}`);
      }
      const cinematic = this.dialogue?.cinematics.find((candidate) => candidate.id === action.cinematicId);
      if (!cinematic) throw new Error(`Unknown cinematic '${action.cinematicId}'`);
      const nextStack = [...cinematicStack, action.cinematicId];
      const actionsFor = (actionIds: readonly string[] | undefined): MissionActionDefinition[] =>
        (actionIds ?? []).map((actionId) => {
          const referenced = this.actionsById.get(actionId);
          if (!referenced) throw new Error(`Unknown cinematic action '${actionId}'`);
          return this.expandPresentationAction(referenced, nextStack);
        });
      const presentation = {
        ...action,
        id: syntheticActionId(action.id, "present"),
        waitForCompletion: true,
        presentationOnly: true,
        fallbackAction: undefined
      } satisfies MissionActionDefinition;
      return {
        id: action.id,
        kind: "sequence",
        ...(action.scope ? { scope: action.scope } : {}),
        ...(action.missingReferencePolicy ? { missingReferencePolicy: action.missingReferencePolicy } : {}),
        ...(fallbackAction ? { fallbackAction } : {}),
        actions: [
          cinematicStageAction(action, "prelude"),
          ...(cinematic.gameplayPrelude ?? []).map((candidate) => this.expandPresentationAction(candidate, nextStack)),
          ...actionsFor(cinematic.gameplayPreludeActionIds),
          cinematicStageAction(action, "presenting"),
          presentation,
          cinematicStageAction(action, "finalizing"),
          ...(cinematic.gameplayFinalize ?? []).map((candidate) => this.expandPresentationAction(candidate, nextStack)),
          ...actionsFor(cinematic.gameplayFinalizeActionIds),
          cinematicStageAction(action, "completed")
        ]
      };
    }
    return fallbackAction ? { ...action, fallbackAction } : action;
  }

  private buildPredecessors(phases: readonly MissionPhaseDefinition[]): ReadonlyMap<string, readonly string[]> {
    const result = new Map<string, Set<string>>();
    for (const phase of phases) {
      for (const transition of phase.transitions) {
        for (const targetId of transition.targetPhaseIds) {
          const predecessors = result.get(targetId) ?? new Set<string>();
          predecessors.add(phase.id);
          result.set(targetId, predecessors);
        }
      }
    }
    return new Map([...result].map(([id, predecessors]) => [id, [...predecessors].sort()] as const));
  }

  private trimTrace(): void {
    const trace = this.stateStore.current.integrity.recentTrace;
    if (trace.length > MAX_RECENT_TRACE_ENTRIES) trace.splice(0, trace.length - MAX_RECENT_TRACE_ENTRIES);
  }
}

function deterministicErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "unknown error";
}

export function createCampaignMissionRuntimeState(
  campaignId: CampaignId,
  content: CampaignMissionContent
): CampaignMissionRuntimeState {
  return {
    schemaVersion: CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
    campaignId,
    missionId: content.id,
    missionRevision: content.revision,
    status: "initializing",
    initialized: false,
    activePhaseIds: [...content.initialState.activePhaseIds].sort(),
    completedPhaseIds: [],
    pendingPhaseIds: [],
    facts: Object.fromEntries([...content.initialState.facts].sort(compareById).map((fact) => [fact.id, fact.value])),
    counters: Object.fromEntries(
      [...content.initialState.counters].sort(compareById).map((counter) => [counter.id, counter.value])
    ),
    timers: Object.fromEntries(
      [...content.initialState.timers].sort(compareById).map((timer) => [
        timer.id,
        {
          durationTicks: timer.durationTicks,
          remainingTicks: timer.durationTicks,
          status: timer.state
        }
      ])
    ),
    objectives: Object.fromEntries(
      [...content.objectives]
        .sort(compareById)
        .map((objective) => [objective.id, createObjectiveRuntimeState(objective)])
    ),
    missionMessageHistory: [],
    dialoguePresentations: {},
    dialogueHistory: [],
    cinematics: {},
    encounters: {},
    claimedTriggerIds: [],
    triggerStates: {},
    claimedRewardIds: [],
    pendingEvents: [],
    actionContinuations: {},
    ownedResources: {},
    integrity: {
      lastProcessedTick: 0,
      lastQueuedEventSequence: 0,
      processedActionCount: 0,
      processedTransitionCount: 0,
      lastTickActionCount: 0,
      lastTickTransitionCount: 0,
      outcomeDispatched: false,
      recentTrace: []
    }
  };
}

/** Stable JSON serialization used for byte-level deterministic assertions and state hashing. */
export function serializeCampaignMissionRuntimeState(state: CampaignMissionRuntimeState): string {
  return JSON.stringify(sortJsonValue(state as unknown as CampaignMissionRuntimeJsonValue));
}

function comparePriorityAndId<T extends { readonly priority: number; readonly id: string }>(left: T, right: T): number {
  return right.priority - left.priority || left.id.localeCompare(right.id);
}

function compareById<T extends { readonly id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function compareRuntimeEvents(left: CampaignMissionRuntimeEvent, right: CampaignMissionRuntimeEvent): number {
  return (
    left.tick - right.tick ||
    left.kind.localeCompare(right.kind) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.sequence - right.sequence
  );
}

function addSortedUnique(values: string[], value: string): void {
  if (!values.includes(value)) values.push(value);
  values.sort();
}

function removeValue(values: string[], value: string): void {
  const index = values.indexOf(value);
  if (index >= 0) values.splice(index, 1);
}

function sortRecord<T>(value: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function sortJsonValue(value: CampaignMissionRuntimeJsonValue): CampaignMissionRuntimeJsonValue {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJsonValue(child)])
    );
  }
  return value;
}

function countActionNodes(action: MissionActionDefinition): number {
  const nested =
    action.kind === "sequence" || action.kind === "parallel" || action.kind === "race"
      ? action.actions.reduce((total, child) => total + countActionNodes(child), 0)
      : 0;
  return 1 + nested + (action.fallbackAction ? countActionNodes(action.fallbackAction) : 0);
}

function syntheticActionId(id: string, suffix: string) {
  return asCampaignContentId<"action">(`${id}-${suffix}`);
}

function cinematicStageAction(
  action: Extract<MissionActionDefinition, { readonly kind: "start-cinematic" }>,
  stage: Extract<MissionActionDefinition, { readonly kind: "set-cinematic-stage" }>["stage"]
): Extract<MissionActionDefinition, { readonly kind: "set-cinematic-stage" }> {
  return {
    id: syntheticActionId(action.id, `mark-${stage}`),
    kind: "set-cinematic-stage",
    cinematicId: action.cinematicId,
    stage
  };
}

function collectMissionActions(content: CampaignMissionContent): ReadonlyMap<string, MissionActionDefinition> {
  const actions = new Map<string, MissionActionDefinition>();
  const add = (action: MissionActionDefinition) => {
    if (actions.has(action.id)) throw new Error(`Duplicate campaign action ID '${action.id}'`);
    actions.set(action.id, action);
    if (action.kind === "sequence" || action.kind === "parallel" || action.kind === "race") {
      for (const child of action.actions) add(child);
    }
    if (action.fallbackAction) add(action.fallbackAction);
  };
  for (const phase of content.phases) {
    for (const action of phase.entryActions) add(action);
    for (const action of phase.exitActions) add(action);
    for (const trigger of phase.triggers) for (const action of trigger.actions) add(action);
    for (const transition of phase.transitions) for (const action of transition.actions) add(action);
  }
  for (const checkpoint of content.checkpoints) for (const action of checkpoint.requiredActions) add(action);
  return actions;
}

function sourceFromOwnerToken(ownerToken: string): { phaseId?: string; triggerId?: string } {
  const [scope, phaseId, triggerId] = ownerToken.split(":");
  return scope === "phase" ? { phaseId, triggerId: triggerId === "direct" ? undefined : triggerId } : {};
}
