import { Observable, Subject } from "rxjs";
import type {
  CampaignMissionObjectiveChecklistRuntimeState,
  CampaignMissionObjectiveChecklistStatus,
  CampaignMissionObjectiveRuntimeState,
  CampaignMissionObjectiveStatus,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  MissionObjectiveChecklistId,
  MissionObjectiveId,
  MissionReasonId
} from "../../contracts/campaign-content-id";
import type { MissionConditionDefinition } from "../../contracts/mission-condition-definition";
import type {
  MissionObjectiveChecklistDefinition,
  MissionObjectiveDefinition
} from "../../contracts/mission-objective-definition";

/**
 * Objective state authority for the deterministic runtime. It translates authored
 * conditions into persisted objective/checklist state and exposes projections without
 * allowing the HUD to mutate mission state.
 *
 * @see buildCampaignObjectiveProjection for UI-ready data.
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/705
 */
export interface CampaignObjectiveChecklistChange {
  /**
   * stable checklist id used by {@link CampaignObjectiveChecklistChange} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly checklistId: MissionObjectiveChecklistId;
  /**
   * discriminator for {@link CampaignObjectiveChecklistChange}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly previousStatus: CampaignMissionObjectiveChecklistStatus;
  /**
   * discriminator for {@link CampaignObjectiveChecklistChange}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignMissionObjectiveChecklistStatus;
  /**
   * Optional numeric current carried by {@link CampaignObjectiveChecklistChange}. Its units and valid range are
   * defined by {@link CampaignObjectiveChecklistChange} and must remain consistent across producers and
   * consumers.
   */
  readonly current?: number;
  /**
   * Optional numeric bound or quantity carried by {@link CampaignObjectiveChecklistChange}. Interpret it in the
   * owning contract’s units and preserve its validation constraints at boundaries.
   */
  readonly target?: number;
}

/**
 * Defines the structured campaign objective change contract for this module. Its declared surface makes
 * objective id, kind, previous status, status, tick explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignObjectiveChange {
  /**
   * stable objective id used by {@link CampaignObjectiveChange} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly objectiveId: MissionObjectiveId;
  /**
   * discriminator for {@link CampaignObjectiveChange}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "status" | "checklist" | "progress";
  /**
   * discriminator for {@link CampaignObjectiveChange}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly previousStatus: CampaignMissionObjectiveStatus;
  /**
   * discriminator for {@link CampaignObjectiveChange}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: CampaignMissionObjectiveStatus;
  /**
   * temporal value for {@link CampaignObjectiveChange}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * early completed value carried by {@link CampaignObjectiveChange}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly earlyCompleted: boolean;
  /**
   * announce value carried by {@link CampaignObjectiveChange}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly announce: boolean;
  /**
   * Optional stable reason id used by {@link CampaignObjectiveChange} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly reasonId?: MissionReasonId;
  /**
   * collection value on {@link CampaignObjectiveChange}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly checklistChanges: readonly CampaignObjectiveChecklistChange[];
}

/**
 * Defines the structured campaign objective evaluation context contract for this module. Its declared surface
 * makes evaluate explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface CampaignObjectiveEvaluationContext {
  /**
   * operation exposed by {@link CampaignObjectiveEvaluationContext}. Its signature is the compatibility boundary
   * for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  evaluate(condition: MissionConditionDefinition): boolean;
}

export abstract class CampaignObjectiveService {
  abstract getState(id: MissionObjectiveId): Readonly<CampaignMissionObjectiveRuntimeState> | undefined;
  abstract reveal(id: MissionObjectiveId, tick: number): CampaignObjectiveChange | undefined;
  abstract complete(id: MissionObjectiveId, tick: number): CampaignObjectiveChange | undefined;
  abstract fail(id: MissionObjectiveId, tick: number, reasonId?: MissionReasonId): CampaignObjectiveChange | undefined;
  abstract markImpossible(
    id: MissionObjectiveId,
    tick: number,
    reasonId?: MissionReasonId
  ): CampaignObjectiveChange | undefined;
  abstract setChecklistState(
    objectiveId: MissionObjectiveId,
    checklistId: MissionObjectiveChecklistId,
    status: CampaignMissionObjectiveChecklistStatus,
    tick: number
  ): CampaignObjectiveChange | undefined;
  abstract evaluate(tick: number, context: CampaignObjectiveEvaluationContext): readonly CampaignObjectiveChange[];
  abstract objectiveChanges(): Observable<CampaignObjectiveChange>;
  abstract drainChanges(): readonly CampaignObjectiveChange[];
  abstract destroy(): void;
}

/**
 * Owns the synchronized objective/checklist state and its legal transitions. Conditions
 * may complete objectives before they are revealed, optional objectives may expire, and
 * every change is buffered for a local projection rather than being rendered here.
 *
 * ```text
 * authored condition -> objective state -> ordered change queue -> HUD/tutorial projection
 *                         ^                                  |
 *                         +---- action runtime ----------------+
 * ```
 */
export class DefaultCampaignObjectiveService extends CampaignObjectiveService {
  private readonly definitionsById: ReadonlyMap<MissionObjectiveId, MissionObjectiveDefinition>;
  private readonly changes = new Subject<CampaignObjectiveChange>();
  private pendingChanges: CampaignObjectiveChange[] = [];

  constructor(
    private readonly state: CampaignMissionRuntimeState,
    definitions: readonly MissionObjectiveDefinition[]
  ) {
    super();
    this.definitionsById = new Map(definitions.map((definition) => [definition.id, definition] as const));
  }

  getState(id: MissionObjectiveId): Readonly<CampaignMissionObjectiveRuntimeState> | undefined {
    return this.state.objectives[id];
  }

  reveal(id: MissionObjectiveId, tick: number): CampaignObjectiveChange | undefined {
    return this.transition(id, "active", tick);
  }

  complete(id: MissionObjectiveId, tick: number): CampaignObjectiveChange | undefined {
    return this.transition(id, "completed", tick);
  }

  fail(id: MissionObjectiveId, tick: number, reasonId?: MissionReasonId): CampaignObjectiveChange | undefined {
    return this.transition(id, "failed", tick, reasonId);
  }

  markImpossible(
    id: MissionObjectiveId,
    tick: number,
    reasonId?: MissionReasonId
  ): CampaignObjectiveChange | undefined {
    return this.transition(id, "impossible", tick, reasonId);
  }

  setChecklistState(
    objectiveId: MissionObjectiveId,
    checklistId: MissionObjectiveChecklistId,
    status: CampaignMissionObjectiveChecklistStatus,
    tick: number
  ): CampaignObjectiveChange | undefined {
    const objective = this.requireObjective(objectiveId);
    const definition = this.requireDefinition(objectiveId);
    const checklistDefinition = definition.checklist?.find((item) => item.id === checklistId);
    if (!checklistDefinition) throw new Error(`Unknown objective checklist '${objectiveId}/${checklistId}'`);
    if (isTerminal(objective.status)) return undefined;
    const checklist = objective.checklist[checklistId] ?? createChecklistRuntimeState(checklistDefinition);
    if (checklist.status === status) return undefined;
    const previousStatus = checklist.status;
    checklist.status = status;
    checklist.updatedAtTick = tick;
    objective.checklist[checklistId] = checklist;
    objective.updatedAtTick = tick;
    const change = this.createChange(objectiveId, "checklist", objective.status, objective.status, tick, false, [
      checklistChange(checklistId, previousStatus, status, checklist)
    ]);
    if (status === "completed") {
      this.addHistory(definition, checklistDefinition.textId, status, tick, objectiveId);
    }
    return this.emit(change);
  }

  evaluate(tick: number, context: CampaignObjectiveEvaluationContext): readonly CampaignObjectiveChange[] {
    const before = this.pendingChanges.length;
    for (const definition of [...this.definitionsById.values()]) {
      const objective = this.requireObjective(definition.id);
      if (isTerminal(objective.status)) continue;
      this.evaluateChecklist(definition, objective, tick, context);
      if (definition.impossible && context.evaluate(definition.impossible)) {
        this.markImpossible(definition.id, tick);
        continue;
      }
      if (definition.fail && context.evaluate(definition.fail)) {
        this.fail(definition.id, tick);
        continue;
      }
      if (context.evaluate(definition.complete)) {
        this.complete(definition.id, tick);
        continue;
      }
      if (
        objective.status === "hidden" &&
        this.dependenciesCompleted(definition) &&
        context.evaluate(definition.reveal)
      ) {
        this.reveal(definition.id, tick);
      }
    }
    return this.pendingChanges.slice(before);
  }

  objectiveChanges(): Observable<CampaignObjectiveChange> {
    return this.changes.asObservable();
  }

  drainChanges(): readonly CampaignObjectiveChange[] {
    const result = this.pendingChanges;
    this.pendingChanges = [];
    return result;
  }

  destroy(): void {
    this.changes.complete();
    this.pendingChanges = [];
  }

  /**
   * Applies one legal objective-status transition and emits the single canonical change
   * record consumed by the runtime and HUD. Terminal objectives are deliberately
   * immutable, while an objective completed before revelation preserves `earlyCompleted`
   * so authoring and presentation can distinguish it from a normal visible completion.
   *
   * @see {@link evaluateChecklist} for the progress-only change path.
   */
  private transition(
    id: MissionObjectiveId,
    status: Exclude<CampaignMissionObjectiveStatus, "hidden">,
    tick: number,
    reasonId?: MissionReasonId
  ): CampaignObjectiveChange | undefined {
    const objective = this.requireObjective(id);
    const definition = this.requireDefinition(id);
    if (objective.status === status || isTerminal(objective.status)) return undefined;
    const previousStatus = objective.status;
    const earlyCompleted = status === "completed" && previousStatus === "hidden";
    objective.status = status;
    objective.updatedAtTick = tick;
    objective.earlyCompleted ||= earlyCompleted;
    if (reasonId) objective.reasonId = reasonId;
    else delete objective.reasonId;
    if (status === "active") objective.revealedAtTick = tick;
    if (status === "completed") objective.completedAtTick = tick;
    if (status === "failed") objective.failedAtTick = tick;
    if (status === "impossible") objective.impossibleAtTick = tick;
    const announce = shouldAnnounce(definition, status) && !objective.announcedStatuses.includes(status);
    if (announce) objective.announcedStatuses.push(status);
    const change = this.createChange(id, "status", previousStatus, status, tick, announce, [], reasonId);
    this.addHistory(definition, definition.titleTextId, status, tick, id);
    return this.emit(change);
  }

  /**
   * Re-evaluates every checklist item in declaration order after a world event. Counter
   * progress can update without changing objective status; that produces a progress
   * change rather than an announcement, which keeps HUD updates deterministic and
   * prevents replays from inventing completion notifications.
   */
  private evaluateChecklist(
    definition: MissionObjectiveDefinition,
    objective: CampaignMissionObjectiveRuntimeState,
    tick: number,
    context: CampaignObjectiveEvaluationContext
  ): void {
    for (const checklistDefinition of definition.checklist ?? []) {
      const checklist = objective.checklist[checklistDefinition.id] ?? createChecklistRuntimeState(checklistDefinition);
      objective.checklist[checklistDefinition.id] = checklist;
      const current = checklistDefinition.progress
        ? (this.state.counters[checklistDefinition.progress.counterId] ?? 0)
        : undefined;
      const progressChanged = current !== checklist.current;
      if (checklistDefinition.progress) {
        checklist.current = current;
        checklist.target = checklistDefinition.progress.target;
      }
      if (checklist.status !== "completed" && context.evaluate(checklistDefinition.complete)) {
        this.setChecklistState(definition.id, checklistDefinition.id, "completed", tick);
      } else if (progressChanged) {
        checklist.updatedAtTick = tick;
        objective.updatedAtTick = tick;
        this.emit(
          this.createChange(definition.id, "progress", objective.status, objective.status, tick, false, [
            checklistChange(checklistDefinition.id, checklist.status, checklist.status, checklist)
          ])
        );
      }
    }
  }

  private dependenciesCompleted(definition: MissionObjectiveDefinition): boolean {
    return (definition.dependsOnObjectiveIds ?? []).every(
      (objectiveId) => this.state.objectives[objectiveId]?.status === "completed"
    );
  }

  /**
   * Builds the immutable observation shared by queued and reactive objective consumers.
   * Reading `earlyCompleted` from the stored state keeps every projection tied to the
   * transition that actually committed, rather than to a later reconstructed state.
   */
  private createChange(
    objectiveId: MissionObjectiveId,
    kind: CampaignObjectiveChange["kind"],
    previousStatus: CampaignMissionObjectiveStatus,
    status: CampaignMissionObjectiveStatus,
    tick: number,
    announce: boolean,
    checklistChanges: readonly CampaignObjectiveChecklistChange[],
    reasonId?: MissionReasonId
  ): CampaignObjectiveChange {
    return {
      objectiveId,
      kind,
      previousStatus,
      status,
      tick,
      earlyCompleted: this.state.objectives[objectiveId]?.earlyCompleted ?? false,
      announce,
      reasonId,
      checklistChanges
    };
  }

  private emit(change: CampaignObjectiveChange): CampaignObjectiveChange {
    this.pendingChanges.push(change);
    this.changes.next(change);
    return change;
  }

  private addHistory(
    definition: MissionObjectiveDefinition,
    textId: string,
    state: CampaignMissionObjectiveStatus | CampaignMissionObjectiveChecklistStatus,
    tick: number,
    sourceId: string
  ): void {
    this.state.missionMessageHistory.push({
      sequence: (this.state.missionMessageHistory.at(-1)?.sequence ?? 0) + 1,
      tick,
      kind: definition.kind === "tutorial" ? "tutorial" : "objective",
      sourceId,
      textId,
      state
    });
  }

  private requireObjective(id: MissionObjectiveId): CampaignMissionObjectiveRuntimeState {
    const objective = this.state.objectives[id];
    if (!objective) throw new Error(`Unknown objective '${id}'`);
    return objective;
  }

  private requireDefinition(id: MissionObjectiveId): MissionObjectiveDefinition {
    const definition = this.definitionsById.get(id);
    if (!definition) throw new Error(`Unknown objective definition '${id}'`);
    return definition;
  }
}

export function createObjectiveRuntimeState(
  definition: MissionObjectiveDefinition
): CampaignMissionObjectiveRuntimeState {
  return {
    status: "hidden",
    updatedAtTick: 0,
    earlyCompleted: false,
    checklist: Object.fromEntries(
      (definition.checklist ?? []).map((checklist) => [checklist.id, createChecklistRuntimeState(checklist)])
    ),
    announcedStatuses: []
  };
}

function createChecklistRuntimeState(
  definition: MissionObjectiveChecklistDefinition
): CampaignMissionObjectiveChecklistRuntimeState {
  return {
    status: "pending",
    updatedAtTick: 0,
    ...(definition.progress ? { current: 0, target: definition.progress.target } : {})
  };
}

function checklistChange(
  checklistId: MissionObjectiveChecklistId,
  previousStatus: CampaignMissionObjectiveChecklistStatus,
  status: CampaignMissionObjectiveChecklistStatus,
  runtime: CampaignMissionObjectiveChecklistRuntimeState
): CampaignObjectiveChecklistChange {
  return {
    checklistId,
    previousStatus,
    status,
    ...(runtime.current !== undefined ? { current: runtime.current } : {}),
    ...(runtime.target !== undefined ? { target: runtime.target } : {})
  };
}

function isTerminal(status: CampaignMissionObjectiveStatus): boolean {
  return status === "completed" || status === "failed" || status === "impossible";
}

function shouldAnnounce(definition: MissionObjectiveDefinition, status: CampaignMissionObjectiveStatus): boolean {
  if (status === "active") return definition.display.announceReveal;
  if (status === "completed") return definition.display.announceCompletion;
  if (status === "failed") return definition.display.announceFailure ?? true;
  if (status === "impossible") return definition.display.announceImpossible ?? true;
  return false;
}
