import type {
  CampaignId,
  CampaignMissionOutcome,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeJsonValue,
  CampaignMissionRuntimeState,
  CampaignMissionTriggerRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import { CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition, MissionNumericComparison } from "../contracts/mission-condition-definition";
import type { MissionPhaseDefinition, MissionTransitionDefinition } from "../contracts/mission-phase-definition";
import type { MissionTriggerDefinition } from "../contracts/mission-trigger-definition";

export interface CampaignMissionRuntimeEffect {
  readonly tick: number;
  readonly kind: "action" | "phase-entered" | "phase-completed" | "objective-changed" | "outcome-requested";
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
}

interface TickBudget {
  actions: number;
  transitions: number;
}

const DEFAULT_MAX_ACTIONS_PER_TICK = 256;
const DEFAULT_MAX_TRANSITIONS_PER_TICK = 64;
const MAX_RECENT_TRACE_ENTRIES = 128;

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
    this.phasesById = new Map(content.phases.map((phase) => [phase.id, phase] as const));
    this.predecessorsByPhaseId = this.buildPredecessors(content.phases);
    const state = restoredState
      ? this.validateAndCloneRestoredState(restoredState)
      : createCampaignMissionRuntimeState(campaignId, content);
    this.stateStore = new CampaignMissionStateStore(state);
    this.canonicalizeState();
  }

  get state(): Readonly<CampaignMissionRuntimeState> {
    return this.stateStore.current;
  }

  snapshot(): CampaignMissionRuntimeState {
    return this.stateStore.snapshot();
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
      if (!phase || !this.applyActions(phase.entryActions, tick, budget, effects)) break;
      effects.push({ tick, kind: "phase-entered", sourceId: phaseId });
    }
    if (state.status === "running") {
      this.evaluateObjectives(tick, effects);
      this.drainTransitions(tick, budget, effects);
    }
    this.finishTick(budget);
    return this.result(effects);
  }

  /** Adds a deterministic event to the persisted queue; sequence is assigned when omitted. */
  enqueueEvent(event: Omit<CampaignMissionRuntimeEvent, "sequence"> & { readonly sequence?: number }): number {
    const state = this.stateStore.current;
    const sequence = event.sequence ?? state.integrity.lastQueuedEventSequence + 1;
    state.integrity.lastQueuedEventSequence = Math.max(state.integrity.lastQueuedEventSequence, sequence);
    state.pendingEvents.push({ ...event, sequence });
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
    this.advanceTimers();

    const readyEvents = state.pendingEvents.filter((event) => event.tick <= tick).sort(compareRuntimeEvents);
    state.pendingEvents = state.pendingEvents.filter((event) => event.tick > tick);
    for (const event of readyEvents) {
      if (!this.processTriggers(tick, budget, effects, event)) break;
    }
    if (state.status === "running") this.processTriggers(tick, budget, effects);
    if (state.status === "running") this.evaluateObjectives(tick, effects);
    if (state.status === "running") this.drainTransitions(tick, budget, effects);

    state.integrity.lastProcessedTick = tick;
    this.finishTick(budget);
    return effects;
  }

  private processTriggers(
    tick: number,
    budget: TickBudget,
    effects: CampaignMissionRuntimeEffect[],
    event?: CampaignMissionRuntimeEvent
  ): boolean {
    const triggers = this.activePhases()
      .flatMap((phase) => phase.triggers)
      .filter((trigger) => (event ? trigger.kind === "event" : trigger.kind === "condition"))
      .filter((trigger) => !event || !trigger.eventKinds?.length || trigger.eventKinds.includes(event.kind))
      .sort(comparePriorityAndId);

    for (const trigger of triggers) {
      const conditionMet = this.evaluateCondition(trigger.condition);
      if (!this.shouldFireTrigger(trigger, conditionMet, tick)) continue;
      const runtimeState = this.getTriggerState(trigger);
      runtimeState.firedCount += 1;
      runtimeState.lastFiredTick = tick;
      if (trigger.firing.kind === "once") addSortedUnique(this.stateStore.current.claimedTriggerIds, trigger.id);
      if (!this.applyActions(trigger.actions, tick, budget, effects)) return false;
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
    const state = this.stateStore.current;
    for (const objective of [...this.content.objectives].sort(compareById)) {
      const runtime = state.objectives[objective.id];
      if (
        !runtime ||
        runtime.status === "completed" ||
        runtime.status === "failed" ||
        runtime.status === "impossible"
      ) {
        continue;
      }
      if (runtime.status === "hidden" && this.evaluateCondition(objective.reveal)) {
        runtime.status = "active";
        runtime.updatedAtTick = tick;
        effects.push({ tick, kind: "objective-changed", sourceId: objective.id, detail: "active" });
      }
      if (runtime.status !== "active") continue;
      if (objective.fail && this.evaluateCondition(objective.fail)) {
        runtime.status = "failed";
        runtime.updatedAtTick = tick;
        effects.push({ tick, kind: "objective-changed", sourceId: objective.id, detail: "failed" });
      } else if (this.evaluateCondition(objective.complete)) {
        runtime.status = "completed";
        runtime.updatedAtTick = tick;
        for (const rewardId of objective.rewardIds ?? []) addSortedUnique(state.claimedRewardIds, rewardId);
        effects.push({ tick, kind: "objective-changed", sourceId: objective.id, detail: "completed" });
      }
    }
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
      if (!this.applyActions(source.phase.exitActions, tick, budget, effects)) return transitioned;
      removeValue(this.stateStore.current.activePhaseIds, source.phase.id);
      addSortedUnique(this.stateStore.current.completedPhaseIds, source.phase.id);
      effects.push({ tick, kind: "phase-completed", sourceId: source.phase.id });
      transitioned = true;

      for (const transition of source.transitions.sort(comparePriorityAndId)) {
        if (!this.applyActions(transition.actions, tick, budget, effects)) return transitioned;
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
      if (!this.applyActions(phase.entryActions, tick, budget, effects)) return false;
      effects.push({ tick, kind: "phase-entered", sourceId: targetId });
    }
    return true;
  }

  private applyActions(
    actions: readonly MissionActionDefinition[],
    tick: number,
    budget: TickBudget,
    effects: CampaignMissionRuntimeEffect[]
  ): boolean {
    for (const action of actions) {
      if (budget.actions >= this.maxActionsPerTick) {
        this.fail("action-budget-exceeded", `Action budget ${this.maxActionsPerTick} exceeded`, tick, action.id);
        return false;
      }
      budget.actions += 1;
      this.applyAction(action, tick, effects);
      if (this.stateStore.current.status !== "running") return false;
    }
    return true;
  }

  private applyAction(action: MissionActionDefinition, tick: number, effects: CampaignMissionRuntimeEffect[]): void {
    const state = this.stateStore.current;
    switch (action.kind) {
      case "set-fact":
        state.facts[action.factId] = action.value;
        break;
      case "set-counter":
        state.counters[action.counterId] = action.value;
        break;
      case "increment-counter":
        state.counters[action.counterId] = (state.counters[action.counterId] ?? 0) + action.amount;
        break;
      case "start-timer":
        state.timers[action.timerId] = {
          durationTicks: action.durationTicks,
          remainingTicks: action.durationTicks,
          status: "running",
          startedAtTick: tick
        };
        break;
      case "pause-timer": {
        const timer = state.timers[action.timerId];
        if (timer?.status === "running") timer.status = "paused";
        break;
      }
      case "cancel-timer": {
        const timer = state.timers[action.timerId];
        if (timer) timer.status = "cancelled";
        break;
      }
      case "request-outcome":
        state.status = action.outcome;
        effects.push({ tick, kind: "outcome-requested", sourceId: action.reasonId, detail: action.outcome });
        break;
      case "trusted-hook":
        this.fail(
          "invalid-runtime-state",
          `Trusted hook '${action.hookId}' has no deterministic runtime adapter`,
          tick,
          action.hookId
        );
        break;
    }
    state.integrity.processedActionCount += 1;
    effects.push({ tick, kind: "action", sourceId: action.id, detail: action.kind });
  }

  private evaluateCondition(condition: MissionConditionDefinition): boolean {
    const state = this.stateStore.current;
    switch (condition.kind) {
      case "always":
        return true;
      case "never":
        return false;
      case "all":
        return condition.conditions.every((child) => this.evaluateCondition(child));
      case "any":
        return condition.conditions.some((child) => this.evaluateCondition(child));
      case "not":
        return !this.evaluateCondition(condition.condition);
      case "fact":
        return state.facts[condition.factId] === condition.equals;
      case "counter":
        return compareNumber(state.counters[condition.counterId] ?? 0, condition.comparison, condition.value);
      case "timer":
        return state.timers[condition.timerId]?.status === condition.state;
      case "objective":
        return state.objectives[condition.objectiveId]?.status === condition.state;
      case "phase":
        return condition.state === "active"
          ? state.activePhaseIds.includes(condition.phaseId)
          : state.completedPhaseIds.includes(condition.phaseId);
      case "encounter":
        return (state.encounters[condition.encounterId] ?? "inactive") === condition.state;
    }
  }

  private advanceTimers(): void {
    for (const timer of Object.values(this.stateStore.current.timers)) {
      if (timer.status !== "running") continue;
      timer.remainingTicks = Math.max(0, timer.remainingTicks - 1);
      if (timer.remainingTicks === 0) timer.status = "elapsed";
    }
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
    code: "action-budget-exceeded" | "transition-budget-exceeded" | "invalid-runtime-state",
    message: string,
    tick: number,
    sourceId?: string
  ): void {
    const state = this.stateStore.current;
    state.status = "failed";
    state.integrity.diagnostic = { code, message, tick, sourceId };
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
    state.encounters = sortRecord(state.encounters);
    state.triggerStates = sortRecord(state.triggerStates);
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
        .map((objective) => [objective.id, { status: "hidden" as const, updatedAtTick: 0 }])
    ),
    encounters: {},
    claimedTriggerIds: [],
    triggerStates: {},
    claimedRewardIds: [],
    pendingEvents: [],
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

function compareNumber(left: number, comparison: MissionNumericComparison, right: number): boolean {
  switch (comparison) {
    case "equal":
      return left === right;
    case "not-equal":
      return left !== right;
    case "less":
      return left < right;
    case "less-or-equal":
      return left <= right;
    case "greater":
      return left > right;
    case "greater-or-equal":
      return left >= right;
  }
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
