import type {
  CampaignId,
  CampaignMissionOutcome,
  CampaignMissionOwnedResourceRuntimeState,
  CampaignMissionProgressionSnapshot,
  CampaignMissionRuntimeDiagnostic,
  CampaignMissionRuntimeEvent,
  CampaignMissionRuntimeJsonValue,
  CampaignMissionRuntimeState,
  CampaignMissionTriggerRuntimeState,
  CampaignParticipantProgressionSnapshot
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS,
  CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import { asCampaignContentId, type ScenarioGroupId } from "../contracts/campaign-content-id";
import type { CampaignDifficulty } from "../contracts/mission-difficulty-definition";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition } from "../contracts/mission-condition-definition";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionPhaseDefinition, MissionTransitionDefinition } from "../contracts/mission-phase-definition";
import type { MissionParticipantDefinition } from "../contracts/mission-participant-definition";
import type { MissionTriggerDefinition } from "../contracts/mission-trigger-definition";
import {
  CampaignActionRunner,
  type CampaignMissionActionCancelReason,
  type CampaignMissionActionContext,
  type CampaignMissionActionResult,
  type CampaignObjectiveActionPort,
  type CampaignPresentationActionPort,
  type CampaignWorldActionAdapter,
  createCampaignActionExecutorRegistry,
  toContinuationRuntimeState
} from "./actions/campaign-action-runtime";
import {
  CampaignConditionRuntime,
  type CampaignWorldConditionAdapter,
  createCampaignConditionEvaluatorRegistry
} from "./conditions/campaign-condition-evaluator";
import {
  type CampaignObjectiveChange,
  createObjectiveRuntimeState,
  DefaultCampaignObjectiveService
} from "./objectives/campaign-objective-service";
import {
  type ResolvedMissionDifficulty,
  resolveMissionDifficulty,
  resolveMissionEncounter
} from "./campaign-difficulty-resolver";
import {
  type CampaignEncounterEffect,
  type CampaignEncounterWorldAdapter,
  DefaultCampaignEncounterService
} from "./encounters/campaign-encounter-service";
import { resolveCampaignParticipantLaunchSlots, updateCampaignParticipantTeams } from "./campaign-participant-resolver";
import {
  CampaignRunIntegrityService,
  createEligibleMissionRunIntegrity
} from "../progression/campaign-run-integrity-service";
import type { CampaignDeveloperCommand } from "../tooling/campaign-diagnostics-service";
import {
  evaluateMissionTriggerParticipantPolicy,
  type ResolvedMissionParticipant,
  resolveMissionParticipants
} from "./campaign-coop-policy";

/**
 * Deterministic, rendering-free mission statechart authority. It advances only from
 * simulation ticks, serializes one canonical snapshot, and emits effects for adapters
 * rather than mutating Phaser or UI state directly.
 *
 * @see CampaignMissionDirector for scene lifecycle ownership.
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/702
 */
export interface CampaignMissionRuntimeEffect {
  /**
   * temporal value for {@link CampaignMissionRuntimeEffect}. It anchors ordering, expiry, or presentation timing
   * and must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * discriminator for {@link CampaignMissionRuntimeEffect}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind:
    | "action"
    | "action-waiting"
    | "action-cancelled"
    | "phase-entered"
    | "phase-completed"
    | "objective-changed"
    | "encounter-changed"
    | "outcome-requested";
  /**
   * stable source id used by {@link CampaignMissionRuntimeEffect} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly sourceId: string;
  /**
   * Optional detail value carried by {@link CampaignMissionRuntimeEffect}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly detail?: CampaignMissionRuntimeJsonValue;
}

/**
 * Defines the structured campaign mission runtime result contract for this module. Its declared surface makes
 * state, effects explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignMissionRuntimeResult {
  /**
   * discriminator for {@link CampaignMissionRuntimeResult}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly state: CampaignMissionRuntimeState;
  /**
   * collection value on {@link CampaignMissionRuntimeResult}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly effects: readonly CampaignMissionRuntimeEffect[];
}

/**
 * Defines the structured campaign mission runtime options contract for this module. Its declared surface makes
 * max actions per tick, max transitions per tick, action adapter, condition adapter, dialogue explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface CampaignMissionRuntimeOptions {
  /**
   * Optional temporal value for {@link CampaignMissionRuntimeOptions}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  readonly maxActionsPerTick?: number;
  /**
   * Optional temporal value for {@link CampaignMissionRuntimeOptions}. It anchors ordering, expiry, or
   * presentation timing and must use the time domain declared by the enclosing contract.
   */
  readonly maxTransitionsPerTick?: number;
  /**
   * Optional action adapter value carried by {@link CampaignMissionRuntimeOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly actionAdapter?: CampaignWorldActionAdapter;
  /**
   * Optional condition adapter value carried by {@link CampaignMissionRuntimeOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly conditionAdapter?: CampaignWorldConditionAdapter;
  /**
   * Optional dialogue value carried by {@link CampaignMissionRuntimeOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly dialogue?: MissionDialogueBundle;
  /**
   * Optional difficulty value carried by {@link CampaignMissionRuntimeOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly difficulty?: CampaignDifficulty;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignMissionRuntimeOptions}. Interpret it in the
   * owning contract’s units and preserve its validation constraints at boundaries.
   */
  readonly playerCount?: number;
  /**
   * Optional encounter adapter value carried by {@link CampaignMissionRuntimeOptions}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly encounterAdapter?: CampaignEncounterWorldAdapter;
  /**
   * Optional progression snapshot value carried by {@link CampaignMissionRuntimeOptions}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  readonly progressionSnapshot?: CampaignMissionProgressionSnapshot;
  /**
   * Optional collection value on {@link CampaignMissionRuntimeOptions}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly participantProgressionSnapshots?: readonly CampaignParticipantProgressionSnapshot[];
  /** Documents the participant policy state member and its declared contract at this boundary. */
  readonly participantPolicyState?: () => CampaignMissionParticipantPolicyState;
}

/**
 * Defines the structured campaign mission participant policy state contract for this module. Its declared
 * surface makes connected human player numbers, required group player numbers explicit to every consumer. Use
 * this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignMissionParticipantPolicyState {
  /**
   * collection value on {@link CampaignMissionParticipantPolicyState}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly connectedHumanPlayerNumbers: readonly number[];
  /**
   * Optional collection value on {@link CampaignMissionParticipantPolicyState}. Its element type defines the
   * records that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on
   * it.
   */
  readonly requiredGroupPlayerNumbers?: Readonly<Partial<Record<ScenarioGroupId, readonly number[]>>>;
}

/**
 * Defines the structured tick budget contract for this module. Its declared surface makes actions, transitions
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
interface TickBudget {
  /**
   * collection owned by {@link TickBudget}. Preserve the declared element contract and any ordering/uniqueness
   * semantics when reading, serializing, or extending it.
   */
  actions: number;
  /**
   * numeric transitions carried by {@link TickBudget}. Its units and valid range are defined by {@link
   * TickBudget} and must remain consistent across producers and consumers.
   */
  transitions: number;
}

/**
 * Defines the structured action source context contract for this module. Its declared surface makes phase id,
 * trigger id, event explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
interface ActionSourceContext {
  /**
   * Optional stable phase id used by {@link ActionSourceContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly phaseId?: string;
  /**
   * Optional stable trigger id used by {@link ActionSourceContext} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly triggerId?: string;
  /**
   * Optional event value carried by {@link ActionSourceContext}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
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

function runtimeNumberArray(value: CampaignMissionRuntimeJsonValue | undefined): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((entry): entry is number => typeof entry === "number" && Number.isSafeInteger(entry));
}

function runtimeGroupPlayerNumbers(
  value: CampaignMissionRuntimeJsonValue | undefined
): Readonly<Partial<Record<ScenarioGroupId, readonly number[]>>> | undefined {
  const groups = runtimeJsonObject(value);
  if (!groups) return undefined;
  return Object.fromEntries(
    Object.entries(groups).flatMap(([groupId, playerNumbers]) => {
      const values = runtimeNumberArray(playerNumbers);
      return values ? [[asCampaignContentId<"scenario-group">(groupId), values]] : [];
    })
  );
}

function isLocalPresentationEvent(kind: string): boolean {
  return (CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS as readonly string[]).includes(kind);
}

/** Defines the campaign mission state store contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class CampaignMissionStateStore {
  constructor(private readonly value: CampaignMissionRuntimeState) {}

  get current(): CampaignMissionRuntimeState {
    return this.value;
  }

  snapshot(): CampaignMissionRuntimeState {
    return structuredClone(this.value);
  }
}

/**
 * Authoritative deterministic interpreter for one authored mission. It owns the only
 * mutable campaign snapshot and advances it in a fixed order: queued events, phase
 * transitions, action continuations, objectives, encounters, checkpoints, and outcome.
 * World/UI work is emitted as effects so a replay, headless harness, and Phaser scene
 * observe identical state for the same tick stream.
 *
 * ```text
 * continuation -> timers/encounters -> ready events -> triggers -> objectives
 *       ^                                                        |
 *       +---- persisted waiting action <- effects <- phases/checkpoints
 * ```
 *
 * Each arrow is ordered within one simulation tick. A budget breach, invalid reference,
 * or adapter exception takes the fail-closed path; local dialogue/cinematic events only
 * update their persisted presentation acknowledgement and never start gameplay work.
 */
export class CampaignMissionRuntime {
  private readonly phasesById: ReadonlyMap<string, MissionPhaseDefinition>;
  private readonly predecessorsByPhaseId: ReadonlyMap<string, readonly string[]>;
  private readonly stateStore: CampaignMissionStateStore;
  private readonly actionsById: ReadonlyMap<string, MissionActionDefinition>;
  private readonly actionRunner: CampaignActionRunner;
  private readonly conditionRuntime: CampaignConditionRuntime;
  private readonly objectiveService: DefaultCampaignObjectiveService;
  private readonly encounterService: DefaultCampaignEncounterService;
  private readonly actionAdapter?: CampaignWorldActionAdapter;
  private readonly dialogue?: MissionDialogueBundle;
  private readonly encounterAdapter?: CampaignEncounterWorldAdapter;
  private readonly maxActionsPerTick: number;
  private readonly maxTransitionsPerTick: number;
  private readonly participants: readonly ResolvedMissionParticipant[];
  private readonly participantPolicyState?: () => CampaignMissionParticipantPolicyState;

  constructor(
    private readonly campaignId: CampaignId,
    private readonly content: CampaignMissionContent,
    restoredState?: CampaignMissionRuntimeState,
    options: CampaignMissionRuntimeOptions = {}
  ) {
    this.maxActionsPerTick = options.maxActionsPerTick ?? DEFAULT_MAX_ACTIONS_PER_TICK;
    this.maxTransitionsPerTick = options.maxTransitionsPerTick ?? DEFAULT_MAX_TRANSITIONS_PER_TICK;
    this.actionAdapter = options.actionAdapter;
    this.encounterAdapter = options.encounterAdapter;
    this.dialogue = options.dialogue;
    this.participantPolicyState = options.participantPolicyState;
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
    const resolvedDifficulty: ResolvedMissionDifficulty = restoredState
      ? { ...restoredState.difficulty }
      : resolveMissionDifficulty(
          content.difficulty,
          options.difficulty ?? "normal",
          options.playerCount ??
            Math.max(1, content.participants.filter((participant) => participant.controller === "human").length)
        );
    this.participants = resolveMissionParticipants(content.participants, content.coop, resolvedDifficulty.playerCount);
    const state = restoredState
      ? this.validateAndCloneRestoredState(restoredState)
      : createCampaignMissionRuntimeState(
          campaignId,
          content,
          resolvedDifficulty,
          options.progressionSnapshot,
          this.participants,
          options.participantProgressionSnapshots
        );
    this.stateStore = new CampaignMissionStateStore(state);
    this.objectiveService = new DefaultCampaignObjectiveService(state, content.objectives);
    this.encounterService = new DefaultCampaignEncounterService(
      (content.encounters ?? []).map((encounter) => resolveMissionEncounter(encounter, resolvedDifficulty)),
      state.encounters,
      `${campaignId}:${content.id}:${content.revision}:${resolvedDifficulty.difficulty}:${resolvedDifficulty.playerCount}`
    );
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

  invalidateRewardIntegrity(reason: string): void {
    new CampaignRunIntegrityService(this.stateStore.current).invalidate(reason);
    this.canonicalizeState();
  }

  discoverReward(rewardId: string): void {
    new CampaignRunIntegrityService(this.stateStore.current).discoverReward(rewardId);
    this.canonicalizeState();
  }

  /**
   * Applies an allowed developer command through the same runtime paths as authored
   * progression. Commands that mutate the run invalidate reward integrity first, while
   * inspect-only commands leave the persisted eligibility state untouched. The returned
   * effects still require a scene adapter to perform any world or presentation change.
   */
  executeDeveloperCommand(command: CampaignDeveloperCommand): CampaignMissionRuntimeResult {
    const effects: CampaignMissionRuntimeEffect[] = [];
    const tick = this.stateStore.current.integrity.lastProcessedTick;
    const budget: TickBudget = { actions: 0, transitions: 0 };
    switch (command.kind) {
      case "set-fact":
        this.stateStore.current.facts[command.factId] = command.value;
        break;
      case "set-counter":
        this.stateStore.current.counters[command.counterId] = command.value;
        break;
      case "set-objective": {
        const objectiveId = asCampaignContentId<"objective">(command.objectiveId);
        if (command.state === "completed") this.objectiveService.complete(objectiveId, tick);
        else this.objectiveService.fail(objectiveId, tick);
        this.publishObjectiveChanges(this.objectiveService.drainChanges(), effects);
        break;
      }
      case "fire-trigger": {
        const trigger = this.content.phases
          .flatMap((phase) => phase.triggers)
          .find((candidate) => candidate.id === command.triggerId);
        if (trigger) this.applyActions(trigger.actions, tick, budget, effects, { triggerId: trigger.id });
        break;
      }
      case "play-cinematic":
        this.applyActions(
          [
            {
              id: asCampaignContentId<"action">(`developer-cinematic-${command.cinematicId}`),
              kind: "start-cinematic",
              scope: "mission",
              cinematicId: asCampaignContentId<"cinematic">(command.cinematicId)
            }
          ],
          tick,
          budget,
          effects,
          {}
        );
        break;
      case "start-wave":
        this.applyActions(
          [
            {
              id: asCampaignContentId<"action">(`developer-encounter-${command.encounterId}`),
              kind: "set-encounter-state",
              scope: "mission",
              encounterId: asCampaignContentId<"encounter">(command.encounterId),
              state: "active"
            }
          ],
          tick,
          budget,
          effects,
          {}
        );
        break;
      case "revive-hero":
        this.applyActions(
          [
            {
              id: asCampaignContentId<"action">(`developer-revive-${command.actorId}`),
              kind: "revive-actor",
              scope: "mission",
              actorId: asCampaignContentId<"scenario-actor">(command.actorId)
            }
          ],
          tick,
          budget,
          effects,
          {}
        );
        break;
      case "request-outcome":
        this.applyActions(
          [
            {
              id: asCampaignContentId<"action">(`developer-outcome-${command.outcome}`),
              kind: "request-outcome",
              scope: "mission",
              outcome: command.outcome,
              reasonId: asCampaignContentId<"reason">("developer-command")
            }
          ],
          tick,
          budget,
          effects,
          {}
        );
        break;
      case "discover-reward":
        this.discoverReward(command.rewardId);
        break;
      case "focus-actor":
      case "highlight-region":
        break;
    }
    this.canonicalizeState();
    return this.result(effects);
  }

  cancel(reason: CampaignMissionActionCancelReason = "mission-ended"): CampaignMissionRuntimeResult {
    const effects: CampaignMissionRuntimeEffect[] = [];
    this.cancelOwnedByPrefix("", reason, this.stateStore.current.integrity.lastProcessedTick, effects);
    this.objectiveService.destroy();
    return this.result(effects);
  }

  /** Documents the retry from checkpoint member and its declared contract at this boundary. */
  retryFromCheckpoint(checkpointId: string, tick: number): CampaignMissionRuntimeResult {
    const checkpoint = this.content.checkpoints.find((candidate) => candidate.id === checkpointId);
    if (!checkpoint?.retryCleanupActions?.length) return this.result([]);
    const effects: CampaignMissionRuntimeEffect[] = [];
    const budget: TickBudget = { actions: 0, transitions: 0 };
    this.applyActions(checkpoint.retryCleanupActions, tick, budget, effects, {
      triggerId: `checkpoint-retry-${checkpointId}`
    });
    this.finishTick(budget);
    return this.result(effects);
  }

  /** Documents the start member and its declared contract at this boundary. */
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
      this.advanceEncounters(tick, budget, effects);
      this.settleTick(tick, budget, effects, false);
      this.processCheckpoints(tick, budget, effects);
    }
    this.finishTick(budget);
    return this.result(effects);
  }

  /** Documents the enqueue event member and its declared contract at this boundary. */
  enqueueEvent(event: Omit<CampaignMissionRuntimeEvent, "sequence"> & { readonly sequence?: number }): number {
    const state = this.stateStore.current;
    const sequence = event.sequence ?? state.integrity.lastQueuedEventSequence + 1;
    state.integrity.lastQueuedEventSequence = Math.max(state.integrity.lastQueuedEventSequence, sequence);
    const queuedEvent = { ...event, sequence } as CampaignMissionRuntimeEvent;
    this.applyPresentationEvent(queuedEvent);
    this.encounterService.observeEvent(queuedEvent);
    state.pendingEvents.push(queuedEvent);
    this.canonicalizeState();
    return sequence;
  }

  /** Documents the advance to member and its declared contract at this boundary. */
  advanceTo(tick: number): CampaignMissionRuntimeResult {
    const effects: CampaignMissionRuntimeEffect[] = [];
    while (this.stateStore.current.status === "running" && this.stateStore.current.integrity.lastProcessedTick < tick) {
      effects.push(...this.processTick(this.stateStore.current.integrity.lastProcessedTick + 1));
    }
    return this.result(effects);
  }

  /** Documents the claim outcome member and its declared contract at this boundary. */
  claimOutcome(): Extract<CampaignMissionOutcome, "victory" | "defeat"> | undefined {
    const state = this.stateStore.current;
    if (state.integrity.outcomeDispatched || (state.status !== "victory" && state.status !== "defeat")) {
      return undefined;
    }
    state.integrity.outcomeDispatched = true;
    return state.status;
  }

  /**
   * Runs one complete deterministic simulation tick.
   * Continuations resume before new timers and encounters, then event/condition settlement and checkpoint capture run against the same tick; the processed-tick marker is written only after that ordered work completes.
   */
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
    this.advanceEncounters(tick, budget, effects);

    this.settleTick(tick, budget, effects, true);
    this.processCheckpoints(tick, budget, effects);

    state.integrity.lastProcessedTick = tick;
    this.finishTick(budget);
    return effects;
  }

  /**
   * Repeatedly settles work that can become immediately eligible at the current tick.
   * It drains queued events before condition polling, evaluates objectives before transitions, and loops only while the mission remains running so a terminal action cannot leave later same-tick work partially applied.
   */
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

  /**
   * Consumes every event whose authored tick is now due in stable sequence order.
   * Local presentation acknowledgements are already folded into state and deliberately skip trigger dispatch, keeping local UI timing from changing deterministic gameplay.
   */
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

  /**
   * Selects triggers from active phases, filters them by event kind and participant policy, then evaluates them in priority/ID order.
   * It records firing history before actions run so once, edge, cadence, and repeatable policies retain the same behavior after save/restore.
   */
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
      .filter(({ trigger }) => this.participantPolicyAllows(trigger, event))
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

  /**
   * Resolves the authored participant policy using synchronized participant state when available, then event payload fallbacks.
   * This keeps solo substitution and future co-op rules at one decision point instead of letting individual triggers infer connected players differently.
   */
  private participantPolicyAllows(trigger: MissionTriggerDefinition, event?: CampaignMissionRuntimeEvent): boolean {
    const payload = runtimeJsonObject(event?.payload);
    const synchronizedPolicyState = this.participantPolicyState?.();
    return evaluateMissionTriggerParticipantPolicy(trigger.participantPolicy, {
      event,
      participants: this.participants,
      connectedHumanPlayerNumbers:
        synchronizedPolicyState?.connectedHumanPlayerNumbers ??
        this.participants
          .filter((participant) => participant.controller === "human")
          .map((participant) => participant.playerNumber),
      participatingPlayerNumbers: runtimeNumberArray(payload?.["participatingPlayerNumbers"]),
      requiredGroupPlayerNumbers:
        synchronizedPolicyState?.requiredGroupPlayerNumbers ??
        runtimeGroupPlayerNumbers(payload?.["requiredGroupPlayerNumbers"])
    });
  }

  /**
   * Updates the persisted condition edge/history and applies the trigger's firing policy.
   * The prior value and last-fire tick are stored even when no action follows, which is required for cooldown and rising-edge behavior to survive a snapshot.
   */
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

  /**
   * Claims authored checkpoints only after their trigger and prerequisite actions have settled.
   * It keeps a pending marker while asynchronous actions or cinematics are active, then emits the canonical checkpoint-save action exactly once.
   */
  private processCheckpoints(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): void {
    const state = this.stateStore.current;
    state.claimedCheckpointIds ??= [];
    state.pendingCheckpointIds ??= [];
    for (const checkpoint of [...this.content.checkpoints].sort(compareById)) {
      if (state.claimedCheckpointIds.includes(checkpoint.id)) continue;
      if (!state.pendingCheckpointIds.includes(checkpoint.id)) {
        if (!this.evaluateCondition(checkpoint.trigger)) continue;
        addSortedUnique(state.pendingCheckpointIds, checkpoint.id);
        if (
          !this.applyActions(checkpoint.requiredActions, tick, budget, effects, {
            triggerId: `checkpoint-${checkpoint.id}`
          })
        ) {
          return;
        }
      }
      if (checkpoint.requiredActions.some((action) => state.actionContinuations[action.id])) continue;
      if (checkpoint.savePolicy === "post-cinematic" && state.activeCinematicId) continue;
      const saveAction: MissionActionDefinition = {
        id: asCampaignContentId<"action">(`checkpoint-save-${checkpoint.id}`),
        kind: "create-checkpoint",
        scope: "mission",
        checkpointId: checkpoint.id
      };
      if (!this.applyActions([saveAction], tick, budget, effects, { triggerId: `checkpoint-${checkpoint.id}` })) return;
      removeValue(state.pendingCheckpointIds, checkpoint.id);
      addSortedUnique(state.claimedCheckpointIds, checkpoint.id);
      state.lastCheckpointId = checkpoint.id;
    }
  }

  /**
   * Delegates encounter/wave progress to the deterministic encounter service and converts its changes into runtime effects.
   * Encounter spawning remains adapter-owned, while this method supplies the shared condition/action budget that prevents waves from bypassing mission ordering.
   */
  private advanceEncounters(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): void {
    const encounterEffects = this.encounterService.advance({
      tick,
      evaluate: (condition) => this.evaluateCondition(condition),
      executeActions: (actions) => this.applyActions(actions, tick, budget, effects, {}),
      world: this.encounterAdapter
    });
    for (const effect of encounterEffects) this.publishEncounterEffect(effect, effects);
  }

  /**
   * Projects one persisted encounter change into an external effect and a follow-up runtime event.
   * Publishing both lets HUD/diagnostics react locally while subsequent authored triggers observe the same encounter transition on the deterministic event queue.
   */
  private publishEncounterEffect(effect: CampaignEncounterEffect, effects: CampaignMissionRuntimeEffect[]): void {
    const state = this.stateStore.current.encounters[effect.encounterId];
    if (!state) return;
    effects.push({
      tick: effect.tick,
      kind: "encounter-changed",
      sourceId: effect.encounterId,
      detail: {
        status: state.status,
        kind: effect.kind,
        waveId: effect.waveId ?? null,
        detail: effect.detail ?? null
      }
    });
    this.enqueueEvent({
      tick: effect.tick,
      kind:
        effect.kind === "wave-spawned"
          ? "encounter.wave-spawned"
          : effect.kind === "wave-warning"
            ? "encounter.wave-warning"
            : "encounter.changed",
      sourceId: effect.encounterId,
      payload: {
        encounterId: effect.encounterId,
        state: state.status,
        waveId: effect.waveId ?? null,
        detail: effect.detail ?? null
      }
    });
  }

  /**
   * Continues resolving transition waves until no active phase can advance at this tick.
   * A separate loop is needed because an exit action can satisfy another transition immediately without waiting for a later simulation tick.
   */
  private drainTransitions(tick: number, budget: TickBudget, effects: CampaignMissionRuntimeEffect[]): void {
    let transitioned = true;
    while (transitioned && this.stateStore.current.status === "running") {
      transitioned = this.processTransitionWave(tick, budget, effects);
    }
  }

  /**
   * Resolves every eligible transition from the current active phases in stable priority order.
   * Sequential phases choose one transition, parallel phases may choose several, and source phases are cancelled/completed before target entry actions are allowed to run.
   */
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

  /**
   * Promotes pending target phases only after all required predecessor phases complete.
   * It guards against reactivation cycles and executes entry actions under the same budget as the transition that activated the phase.
   */
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

  /**
   * Charges the complete authored action list against the per-tick action budget before each dispatch.
   * It records processed cost and stops at the first terminal/failing result so one overly active content graph cannot make a tick unbounded.
   */
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

  /**
   * Creates the fully scoped action context, executes the interpreter safely, flushes objective changes, and reconciles the result.
   * Keeping that sequence together ensures world adapters never see an action without its phase/trigger ownership token.
   */
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

  /**
   * Decrements only running deterministic timers and queues elapsed events at the tick that reached zero.
   * Timer completion is event-driven rather than direct-trigger execution so it follows the normal event ordering path.
   */
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

  /**
   * Resumes waiting actions in owner-token/action-ID order before new authored work.
   * Missing actions are treated as an unresumable content revision error, while each resumed result reuses the original start tick and resource ownership semantics.
   */
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

  /**
   * Builds the narrow capability object passed to an action executor.
   * It exposes the canonical state plus scoped ownership and state-only ports, preventing an executor from reaching arbitrary runtime internals.
   */
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

  /**
   * Reconciles an action result with the statechart after an adapter has attempted it.
   * This is where waiting continuations become persisted, missing-reference policy is
   * applied, fallbacks receive a distinct ownership token, and terminal failures are
   * converted into deterministic diagnostics instead of leaking adapter exceptions.
   */
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
          } satisfies CampaignMissionActionContext;
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
    if (action.kind === "update-alliance") {
      updateCampaignParticipantTeams(
        this.stateStore.current.participantTeams,
        action.playerNumber,
        action.otherPlayerNumber,
        action.allied
      );
    }
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

  /**
   * Persists a waiting action with its resumable interpreter state and deterministic timestamps.
   * Updating this record is the boundary that makes long-running actions, cinematics, and composites safe across save, replay, and reconnect.
   */
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

  /**
   * Executes an action without permitting adapter exceptions to escape the deterministic tick.
   * Errors are converted to stable failure results so diagnostics, missing-reference policy, and mission outcome handling remain reproducible.
   */
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

  /**
   * Provides action executors with the minimal objective mutation operations.
   * The port prevents action code from manipulating raw objective records and ensures every state change is later emitted through the objective projection pipeline.
   */
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

  /**
   * Builds the adapter boundary for presentation-only actions.
   * It records acknowledgement/continuation state in the deterministic snapshot while leaving dialogue and cinematic rendering to the local presentation layer.
   */
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

  /**
   * Converts drained objective-service changes into ordered runtime effects.
   * The service remains the state authority; effects are a projection channel for HUD/tutorial code and never feed a UI mutation back into objectives.
   */
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
        for (const rewardId of objective?.rewardIds ?? []) this.discoverReward(rewardId);
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

  /**
   * Resumes one persisted action continuation and converts unexpected adapter errors into a deterministic failure.
   * It mirrors initial execution so restored actions cannot gain a different failure path than freshly started actions.
   */
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

  /**
   * Associates adapter-created resources with an action ownership token in the persisted snapshot.
   * These records drive phase exit, cancellation, and restore projection cleanup instead of relying on transient scene object references.
   */
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

  /**
   * Cancels every action/resource owned by a phase when it exits.
   * It derives a single phase ownership prefix so trigger and nested-action resources are cleaned consistently before successor phases begin.
   */
  private cancelOwnedByPhase(
    phaseId: string,
    reason: CampaignMissionActionCancelReason,
    tick: number,
    effects: CampaignMissionRuntimeEffect[]
  ): boolean {
    return this.cancelOwnedByPrefix(`phase:${phaseId}:`, reason, tick, effects);
  }

  /**
   * Cancels a phase or mission ownership subtree without leaking its world resources.
   * It removes continuations in stable order, calls the adapter cancellation hook, and preserves cleanup effects so restore and replay observe the same terminal state.
   */
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

  /**
   * Reserves the transition budget before a transition wave mutates phase state.
   * Exceeding the cap fails the mission deterministically, protecting the simulation from authored cycles or self-activating graphs.
   */
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

  /**
   * Resolves an authored phase ID and turns a missing reference into a deterministic runtime failure.
   * Callers therefore never need a non-null assertion for content that may have changed across a save revision.
   */
  private requirePhase(id: string, tick: number): MissionPhaseDefinition | undefined {
    const phase = this.phasesById.get(id);
    if (!phase) this.fail("invalid-runtime-state", `Unknown mission phase '${id}'`, tick, id);
    return phase;
  }

  /**
   * Moves the runtime to a terminal failed state and records a structured diagnostic/effect.
   * This is the single fail-closed path for invalid content, budgets, missing references, and adapter errors.
   */
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
    if (code === "resource-leak") new CampaignRunIntegrityService(state).invalidate("resource-leak");
  }

  /**
   * Canonicalizes all persisted collections after a tick and records the observed action/transition budget.
   * The snapshot is normalized before hashing, saving, or replay consumers can observe it.
   */
  private finishTick(budget: TickBudget): void {
    const integrity = this.stateStore.current.integrity;
    integrity.lastTickActionCount = budget.actions;
    integrity.lastTickTransitionCount = budget.transitions;
    this.canonicalizeState();
  }

  /**
   * Sorts map-like runtime collections and normalizes legacy optional fields into their current schema shape.
   * It is called at mutation boundaries so equivalent execution histories serialize and hash identically.
   */
  private canonicalizeState(): void {
    const state = this.stateStore.current;
    state.activePhaseIds.sort();
    state.completedPhaseIds.sort();
    state.pendingPhaseIds.sort();
    state.claimedTriggerIds.sort();
    state.claimedCheckpointIds?.sort();
    state.pendingCheckpointIds?.sort();
    state.claimedRewardIds.sort();
    if (state.progression) {
      state.progression = { ...state.progression, pendingRewardIds: [...state.claimedRewardIds] };
    }
    state.participantProgressionSnapshots?.sort((left, right) => left.slotId.localeCompare(right.slotId));
    if (state.rewardIntegrity) {
      state.rewardIntegrity = {
        ...state.rewardIntegrity,
        invalidationReasons: [...state.rewardIntegrity.invalidationReasons].sort()
      };
    }
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
    state.participantTeams = sortRecord(state.participantTeams);
    sortRecordInPlace(state.encounters);
    for (const encounter of Object.values(state.encounters)) {
      encounter.livingSpawnedActorIds.sort();
      encounter.spawnedActorOwners = sortRecord(encounter.spawnedActorOwners);
      encounter.deterministicBranchIds = sortRecord(encounter.deterministicBranchIds);
      encounter.warnedWaveIds.sort();
    }
    state.triggerStates = sortRecord(state.triggerStates);
    state.actionContinuations = sortRecord(state.actionContinuations);
    state.ownedResources = sortRecord(state.ownedResources);
  }

  /**
   * Packages effects with a cloned, canonical snapshot for integration boundaries. The
   * clone prevents UI, replay, and scene adapters from mutating runtime authority after
   * a tick, while diagnostics are copied with the result so callers can display failure
   * context without inspecting the live mutable store.
   */
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

  /**
   * Validates the restored snapshot against the current mission identity/schema, applies explicit migration-compatible defaults, and clones it before mutation.
   * The live runtime never retains a caller-owned snapshot reference.
   */
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

  /**
   * Folds local acknowledgement and cinematic progress events back into the deterministic mission snapshot.
   * Events are validated against their owner token and ordered sequence so a stale UI event cannot advance a restored or replaced presentation.
   */
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

  /**
   * Finds the unique active presentation owner for a dialogue line.
   * It resolves ambiguous local acknowledgements conservatively rather than guessing which concurrent presentation should advance.
   */
  private findPresentingDialogueOwner(lineId: string): string | undefined {
    return Object.values(this.stateStore.current.dialoguePresentations)
      .filter((presentation) => presentation.lineId === lineId && presentation.status === "presenting")
      .sort(
        (left, right) => right.startedAtTick - left.startedAtTick || right.ownerToken.localeCompare(left.ownerToken)
      )[0]?.ownerToken;
  }

  /**
   * Converts authored dialogue/cinematic shorthand into executable presentation actions.
   * Expansion is pure and cycle-safe: cinematic references are tracked as a stack, IDs
   * are synthetic but stable, and gameplay-finalization work remains separate from the
   * local-only UI action so saves and replay retain the correct continuation boundary.
   */
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

  /**
   * Builds the reverse phase graph used to enforce join semantics for parallel statecharts.
   * Storing it once at runtime construction avoids recalculating graph relationships during every transition tick.
   */
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

  /**
   * Bounds diagnostic trace growth while retaining the most recent deterministic entries.
   * The cap prevents a long mission from turning saved runtime state into an unbounded debug log.
   */
  private trimTrace(): void {
    const trace = this.stateStore.current.integrity.recentTrace;
    if (trace.length > MAX_RECENT_TRACE_ENTRIES) trace.splice(0, trace.length - MAX_RECENT_TRACE_ENTRIES);
  }
}

function deterministicErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "unknown error";
}

/**
 * Builds the complete JSON-safe initial snapshot from authored content and optional
 * launch choices. Every collection is initialized here so later tick code never has to
 * infer missing state, and stable ordering makes serialization/hash output independent
 * of JavaScript insertion order.
 */
export function createCampaignMissionRuntimeState(
  campaignId: CampaignId,
  content: CampaignMissionContent,
  resolvedDifficulty: ResolvedMissionDifficulty = resolveMissionDifficulty(
    content.difficulty,
    "normal",
    Math.max(1, content.participants.filter((participant) => participant.controller === "human").length)
  ),
  progressionSnapshot?: CampaignMissionProgressionSnapshot,
  participants: readonly MissionParticipantDefinition[] = resolveMissionParticipants(
    content.participants,
    content.coop,
    resolvedDifficulty.playerCount
  ),
  participantProgressionSnapshots?: readonly CampaignParticipantProgressionSnapshot[]
): CampaignMissionRuntimeState {
  return {
    schemaVersion: CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION,
    campaignId,
    missionId: content.id,
    missionRevision: content.revision,
    status: "initializing",
    initialized: false,
    difficulty: { ...resolvedDifficulty },
    activePhaseIds: [...content.initialState.activePhaseIds].sort(),
    completedPhaseIds: [],
    pendingPhaseIds: [],
    facts: Object.fromEntries([...content.initialState.facts].sort(compareById).map((fact) => [fact.id, fact.value])),
    counters: Object.fromEntries(
      [...content.initialState.counters].sort(compareById).map((counter) => [counter.id, counter.value])
    ),
    missionItems: {},
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
    activeControlPlayerNumber: resolveCampaignParticipantLaunchSlots(participants).find(
      (slot) => slot.participant.controller === "human"
    )?.playerNumber,
    participantTeams: Object.fromEntries(
      resolveCampaignParticipantLaunchSlots(participants).map((slot) => [String(slot.playerNumber), slot.teamNumber])
    ),
    encounters: {},
    claimedTriggerIds: [],
    claimedCheckpointIds: [],
    pendingCheckpointIds: [],
    triggerStates: {},
    claimedRewardIds: [],
    ...(progressionSnapshot ? { progression: structuredClone(progressionSnapshot) } : {}),
    ...(participantProgressionSnapshots?.length
      ? {
          participantProgressionSnapshots: participantProgressionSnapshots.map((snapshot) => structuredClone(snapshot))
        }
      : {}),
    rewardIntegrity: createEligibleMissionRunIntegrity(),
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

/** Documents the serialize campaign mission runtime state member and its declared contract at this boundary. */
export function serializeCampaignMissionRuntimeState(state: CampaignMissionRuntimeState): string {
  return JSON.stringify(sortJsonValue(state as unknown as CampaignMissionRuntimeJsonValue));
}

/**
 * Serializes runtime state into stable state-family payloads for hashing, saves, replay, and diagnostics.
 * It sorts map-like structures before encoding so equivalent mission state produces the same wire representation.
 */
export function serializeCampaignMissionRuntimeStateFamilies(
  state: CampaignMissionRuntimeState
): Readonly<Record<string, string>> {
  const serialize = (value: unknown): string => JSON.stringify(sortJsonValue(value as CampaignMissionRuntimeJsonValue));
  return {
    identity: serialize({
      schemaVersion: state.schemaVersion,
      campaignId: state.campaignId,
      missionId: state.missionId,
      missionRevision: state.missionRevision,
      status: state.status,
      initialized: state.initialized,
      difficulty: state.difficulty,
      activeControlPlayerNumber: state.activeControlPlayerNumber,
      participantTeams: state.participantTeams
    }),
    phases: serialize({
      active: state.activePhaseIds,
      completed: state.completedPhaseIds,
      pending: state.pendingPhaseIds,
      checkpoints: state.claimedCheckpointIds ?? [],
      pendingCheckpoints: state.pendingCheckpointIds ?? []
    }),
    factsCountersTimers: serialize({
      facts: state.facts,
      counters: state.counters,
      missionItems: state.missionItems ?? {},
      timers: state.timers
    }),
    objectives: serialize({ objectives: state.objectives, messages: state.missionMessageHistory }),
    triggersActions: serialize({
      claimedTriggers: state.claimedTriggerIds,
      triggerStates: state.triggerStates,
      pendingEvents: state.pendingEvents,
      actionContinuations: state.actionContinuations,
      ownedResources: state.ownedResources
    }),
    encounters: serialize(state.encounters),
    rewardsIntegrity: serialize({
      claimedRewards: state.claimedRewardIds,
      progression: state.progression ?? null,
      participantProgressionSnapshots: state.participantProgressionSnapshots ?? [],
      rewardIntegrity: state.rewardIntegrity ?? null
    }),
    presentation: serialize({
      dialoguePresentations: state.dialoguePresentations,
      dialogueHistory: state.dialogueHistory,
      cinematics: state.cinematics,
      activeCinematicId: state.activeCinematicId ?? null
    })
  };
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

function sortRecordInPlace<T>(value: Record<string, T>): void {
  const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
  for (const key of Object.keys(value)) delete value[key];
  for (const [key, entry] of entries) value[key] = entry;
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
  for (const checkpoint of content.checkpoints) {
    for (const action of checkpoint.requiredActions) add(action);
    for (const action of checkpoint.retryCleanupActions ?? []) add(action);
  }
  return actions;
}

function sourceFromOwnerToken(ownerToken: string): { phaseId?: string; triggerId?: string } {
  const [scope, phaseId, triggerId] = ownerToken.split(":");
  return scope === "phase" ? { phaseId, triggerId: triggerId === "direct" ? undefined : triggerId } : {};
}
