import { BehaviorSubject, Subject } from "rxjs";
import {
  buildCampaignObjectiveProjection,
  CampaignPresentationPriorityQueue,
  createDefaultCampaignInputPromptRegistry,
  createMissionTextResolver,
  type CampaignInputMode,
  type CampaignObjectiveProjection,
  type MissionDialogueBundle,
  type MissionObjectiveDefinition,
  type MissionSemanticInputAction,
  type CampaignMissionRuntimeEffect
} from "@fuzzy-waddle/probable-waffle-campaign";
import type {
  CampaignMissionObjectiveStatus,
  CampaignMissionRuntimeJsonValue,
  CampaignMissionRuntimeState
} from "@fuzzy-waddle/probable-waffle-protocol";

export interface CampaignObjectiveNotification {
  readonly id: string;
  readonly objectiveId: string;
  readonly status: CampaignMissionObjectiveStatus;
  readonly text: string;
  readonly narrationLineId?: string;
}

/** Rebuildable local projection; snapshots never synthesize presentation notifications. */
export class CampaignObjectiveProjectionStore {
  private readonly inputPrompts = createDefaultCampaignInputPromptRegistry();
  private readonly seenInputActions = new Set<MissionSemanticInputAction>();
  private readonly messages = new CampaignPresentationPriorityQueue();
  private readonly text: ReturnType<typeof createMissionTextResolver>;
  private readonly projectionSubject: BehaviorSubject<CampaignObjectiveProjection>;
  private readonly notificationSubject = new Subject<CampaignObjectiveNotification>();

  readonly projection$;
  readonly notifications$ = this.notificationSubject.asObservable();

  constructor(
    private readonly definitions: readonly MissionObjectiveDefinition[],
    private readonly dialogue: MissionDialogueBundle,
    initialState: CampaignMissionRuntimeState,
    private inputMode: CampaignInputMode
  ) {
    this.text = createMissionTextResolver(dialogue);
    this.projectionSubject = new BehaviorSubject(this.build(initialState));
    this.projection$ = this.projectionSubject.asObservable();
  }

  get projection(): CampaignObjectiveProjection {
    return this.projectionSubject.value;
  }

  rebuild(state: CampaignMissionRuntimeState): void {
    this.projectionSubject.next(this.build(state));
  }

  presentEffects(effects: readonly CampaignMissionRuntimeEffect[]): void {
    const notifications = new Map<string, Omit<CampaignObjectiveNotification, "text">>();
    for (const effect of effects) {
      if (effect.kind !== "objective-changed" || !isRecord(effect.detail)) continue;
      if (effect.detail["kind"] !== "status" || effect.detail["announce"] !== true) continue;
      const status = effect.detail["status"];
      if (!isObjectiveStatus(status)) continue;
      const definition = this.definitions.find((candidate) => candidate.id === effect.sourceId);
      if (!definition) continue;
      const narrationLineId = narrationLine(definition, status);
      const id = `objective:${effect.sourceId}:${status}:${effect.tick}`;
      this.messages.enqueue({
        id,
        sourceId: effect.sourceId,
        category:
          status === "failed" || status === "impossible"
            ? "objective-failure"
            : definition.kind === "tutorial"
              ? "tutorial"
              : "objective",
        text: `${notificationPrefix(status)}: ${this.text(definition.titleTextId)}`
      });
      notifications.set(id, {
        id,
        objectiveId: effect.sourceId,
        status,
        narrationLineId
      });
    }
    while (this.messages.size > 0) {
      const queued = this.messages.take();
      if (!queued) continue;
      const notification = notifications.get(queued.id);
      if (!notification) continue;
      this.notificationSubject.next({
        ...notification,
        text: queued.text
      });
    }
  }

  setInputMode(mode: CampaignInputMode, state: CampaignMissionRuntimeState): void {
    this.inputMode = mode;
    this.rebuild(state);
  }

  markPromptSeen(action: MissionSemanticInputAction, state: CampaignMissionRuntimeState): void {
    this.seenInputActions.add(action);
    this.rebuild(state);
  }

  destroy(): void {
    this.messages.clear();
    this.notificationSubject.complete();
    this.projectionSubject.complete();
  }

  private build(state: CampaignMissionRuntimeState): CampaignObjectiveProjection {
    return buildCampaignObjectiveProjection(this.definitions, this.dialogue, state, {
      inputMode: this.inputMode,
      inputPrompts: this.inputPrompts,
      seenInputActions: this.seenInputActions
    });
  }
}

function isRecord(
  value: CampaignMissionRuntimeJsonValue | undefined
): value is { readonly [key: string]: CampaignMissionRuntimeJsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isObjectiveStatus(
  value: CampaignMissionRuntimeJsonValue | undefined
): value is CampaignMissionObjectiveStatus {
  return (
    value === "hidden" || value === "active" || value === "completed" || value === "failed" || value === "impossible"
  );
}

function narrationLine(
  definition: MissionObjectiveDefinition,
  status: CampaignMissionObjectiveStatus
): string | undefined {
  if (status === "active") return definition.display.narration?.revealLineId;
  if (status === "completed") return definition.display.narration?.completionLineId;
  if (status === "failed" || status === "impossible") return definition.display.narration?.failureLineId;
  return undefined;
}

function notificationPrefix(status: CampaignMissionObjectiveStatus): string {
  if (status === "active") return "Objective added";
  if (status === "completed") return "Objective completed";
  if (status === "impossible") return "Objective expired";
  return "Objective failed";
}
