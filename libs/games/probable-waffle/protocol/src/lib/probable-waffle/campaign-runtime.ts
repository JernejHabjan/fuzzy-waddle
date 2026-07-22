import type {
  CampaignId,
  CampaignMissionId,
  CampaignMissionProgressionSnapshot,
  MissionRunIntegrityState
} from "./campaign";

export const CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION = 6 as const;
export const CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS = ["dialogue.presented", "cinematic.cue"] as const;

export type CampaignMissionRuntimeStatus = "initializing" | "running" | "victory" | "defeat" | "failed";
export type CampaignMissionObjectiveStatus = "hidden" | "active" | "completed" | "failed" | "impossible";
export type CampaignMissionObjectiveChecklistStatus = "pending" | "completed";
export type CampaignMissionEncounterStatus = "inactive" | "active" | "completed" | "failed";
export type CampaignMissionTimerStatus = "running" | "paused" | "elapsed" | "cancelled";
export type CampaignMissionDialoguePresentationStatus = "presenting" | "acknowledged";
export type CampaignMissionCinematicStage = "prelude" | "presenting" | "finalizing" | "completed";
export type CampaignLocalPresentationEventKind = (typeof CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS)[number];

export type CampaignMissionRuntimeJsonValue =
  | string
  | number
  | boolean
  | null
  | readonly CampaignMissionRuntimeJsonValue[]
  | { readonly [key: string]: CampaignMissionRuntimeJsonValue };

export interface CampaignMissionRuntimeEvent {
  readonly tick: number;
  readonly kind: string;
  readonly sourceId: string;
  readonly sequence: number;
  readonly payload?: CampaignMissionRuntimeJsonValue;
  readonly initiatorPlayerNumber?: number;
  readonly initiatorFaction?: "tivara" | "skaduwee";
}

interface CampaignMissionEventBase<TKind extends string, TPayload extends CampaignMissionRuntimeJsonValue> {
  readonly tick: number;
  readonly kind: TKind;
  readonly sourceId: string;
  readonly sequence: number;
  readonly payload: TPayload;
  readonly initiatorPlayerNumber?: number;
  readonly initiatorFaction?: "tivara" | "skaduwee";
}

export type CampaignMissionEvent =
  | CampaignMissionEventBase<
      "actor.created",
      {
        readonly actorRuntimeId: string;
        readonly scenarioActorId?: string;
        readonly actorType: string;
        readonly owner?: number;
      }
    >
  | CampaignMissionEventBase<
      "actor.destroyed" | "actor.killed",
      { readonly actorRuntimeId: string; readonly scenarioActorId?: string; readonly actorType: string }
    >
  | CampaignMissionEventBase<
      "actor.owner-changed",
      {
        readonly actorRuntimeId: string;
        readonly scenarioActorId?: string;
        readonly previousOwner?: number;
        readonly owner?: number;
      }
    >
  | CampaignMissionEventBase<
      "actor.entered-region" | "actor.left-region",
      { readonly scenarioActorId: string; readonly regionId: string }
    >
  | CampaignMissionEventBase<
      "construction.completed",
      { readonly scenarioActorId?: string; readonly actorType: string; readonly owner?: number }
    >
  | CampaignMissionEventBase<"research.completed", { readonly playerNumber: number; readonly researchType: string }>
  | CampaignMissionEventBase<
      "resource.changed",
      { readonly playerNumber: number; readonly resourceType: string; readonly delta: number; readonly total: number }
    >
  | CampaignMissionEventBase<"timer.elapsed", { readonly timerId: string }>
  | CampaignMissionEventBase<
      "encounter.changed",
      { readonly encounterId: string; readonly state: CampaignMissionEncounterStatus }
    >
  | CampaignMissionEventBase<
      "encounter.wave-warning" | "encounter.wave-spawned",
      {
        readonly encounterId: string;
        readonly state: CampaignMissionEncounterStatus;
        readonly waveId: string;
        readonly detail: string | null;
      }
    >
  | CampaignMissionEventBase<
      "objective.changed",
      {
        readonly objectiveId: string;
        readonly state: CampaignMissionObjectiveStatus;
        readonly checklistId?: string;
        readonly checklistState?: CampaignMissionObjectiveChecklistStatus;
        readonly current?: number;
        readonly target?: number;
      }
    >
  | CampaignMissionEventBase<"dialogue.presented", { readonly lineId: string; readonly ownerToken: string }>
  | CampaignMissionEventBase<"dialogue.acknowledged", { readonly lineId: string; readonly ownerToken?: string }>
  | CampaignMissionEventBase<"cinematic.cue", { readonly cinematicId: string; readonly cueIndex: number }>
  | CampaignMissionEventBase<"cinematic.finished", { readonly cinematicId: string; readonly skipped: boolean }>;

export interface CampaignMissionTimerRuntimeState {
  durationTicks: number;
  remainingTicks: number;
  status: CampaignMissionTimerStatus;
  startedAtTick?: number;
}

export interface CampaignMissionObjectiveRuntimeState {
  status: CampaignMissionObjectiveStatus;
  updatedAtTick: number;
  revealedAtTick?: number;
  completedAtTick?: number;
  failedAtTick?: number;
  impossibleAtTick?: number;
  reasonId?: string;
  earlyCompleted: boolean;
  checklist: Record<string, CampaignMissionObjectiveChecklistRuntimeState>;
  announcedStatuses: CampaignMissionObjectiveStatus[];
}

export interface CampaignMissionObjectiveChecklistRuntimeState {
  status: CampaignMissionObjectiveChecklistStatus;
  updatedAtTick: number;
  current?: number;
  target?: number;
}

export interface CampaignMissionMessageHistoryEntry {
  sequence: number;
  tick: number;
  kind: "objective" | "tutorial" | "warning";
  sourceId: string;
  textId: string;
  state?: CampaignMissionObjectiveStatus | CampaignMissionObjectiveChecklistStatus;
}

export interface CampaignMissionDialoguePresentationRuntimeState {
  lineId: string;
  ownerToken: string;
  status: CampaignMissionDialoguePresentationStatus;
  startedAtTick: number;
  updatedAtTick: number;
  acknowledgedAtTick?: number;
}

export interface CampaignMissionDialogueHistoryEntry {
  sequence: number;
  tick: number;
  lineId: string;
  ownerToken: string;
}

export interface CampaignMissionCinematicRuntimeState {
  cinematicId: string;
  ownerToken: string;
  stage: CampaignMissionCinematicStage;
  startedAtTick: number;
  updatedAtTick: number;
  finishedAtTick?: number;
  presentationCueIndex?: number;
  finalizeRequested: boolean;
  finalized: boolean;
  skipped: boolean;
}

export interface CampaignMissionTriggerRuntimeState {
  firedCount: number;
  lastCondition: boolean;
  lastFiredTick?: number;
}

export interface CampaignMissionEncounterRuntimeState {
  status: CampaignMissionEncounterStatus;
  waveIndex: number;
  nextEligibleTick?: number;
  livingSpawnedActorIds: string[];
  spawnedActorOwners: Record<string, number>;
  spawnCursor: number;
  deterministicBranchIds: Record<string, string>;
  warnedWaveIds: string[];
  blockedAttempts: number;
  failureReason?: string;
}

export interface CampaignMissionDifficultyRuntimeState {
  difficulty: "story" | "normal" | "hard";
  playerCount: number;
  startingResourceScale?: number;
  waveSizeScale?: number;
  warningTicks?: number;
  damageScale?: number;
  aiAggressionScale?: number;
}

export interface CampaignMissionActionContinuationState {
  actionId: string;
  kind: string;
  ownerToken: string;
  scope: "phase" | "mission";
  startedAtTick: number;
  updatedAtTick: number;
  state: CampaignMissionRuntimeJsonValue;
}

export interface CampaignMissionOwnedResourceRuntimeState {
  resourceId: string;
  kind: string;
  ownerToken: string;
  state?: CampaignMissionRuntimeJsonValue;
}

export interface CampaignMissionRuntimeDiagnostic {
  code:
    | "action-budget-exceeded"
    | "transition-budget-exceeded"
    | "invalid-runtime-state"
    | "action-failed"
    | "missing-reference"
    | "unresumable-action"
    | "resource-leak";
  message: string;
  tick: number;
  sourceId?: string;
  phaseId?: string;
  triggerId?: string;
  actionId?: string;
}

export interface CampaignMissionRuntimeTraceEntry {
  tick: number;
  kind:
    | "action"
    | "action-waiting"
    | "action-cancelled"
    | "phase-entered"
    | "phase-completed"
    | "objective-changed"
    | "encounter-changed"
    | "outcome-requested"
    | "diagnostic";
  sourceId: string;
  detail?: CampaignMissionRuntimeJsonValue;
}

export interface CampaignMissionRuntimeIntegrity {
  lastProcessedTick: number;
  lastQueuedEventSequence: number;
  processedActionCount: number;
  processedTransitionCount: number;
  lastTickActionCount: number;
  lastTickTransitionCount: number;
  outcomeDispatched: boolean;
  recentTrace: CampaignMissionRuntimeTraceEntry[];
  diagnostic?: CampaignMissionRuntimeDiagnostic;
}

/** Canonical JSON-safe mission state included by saves, snapshots, hashes, reconnects, and replays. */
export interface CampaignMissionRuntimeState {
  schemaVersion: typeof CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION;
  campaignId: CampaignId;
  missionId: CampaignMissionId;
  missionRevision: number;
  status: CampaignMissionRuntimeStatus;
  initialized: boolean;
  difficulty: CampaignMissionDifficultyRuntimeState;
  activePhaseIds: string[];
  completedPhaseIds: string[];
  pendingPhaseIds: string[];
  facts: Record<string, boolean | string>;
  counters: Record<string, number>;
  timers: Record<string, CampaignMissionTimerRuntimeState>;
  objectives: Record<string, CampaignMissionObjectiveRuntimeState>;
  missionMessageHistory: CampaignMissionMessageHistoryEntry[];
  dialoguePresentations: Record<string, CampaignMissionDialoguePresentationRuntimeState>;
  dialogueHistory: CampaignMissionDialogueHistoryEntry[];
  cinematics: Record<string, CampaignMissionCinematicRuntimeState>;
  activeCinematicId?: string;
  participantTeams: Record<string, number>;
  encounters: Record<string, CampaignMissionEncounterRuntimeState>;
  claimedTriggerIds: string[];
  triggerStates: Record<string, CampaignMissionTriggerRuntimeState>;
  claimedRewardIds: string[];
  /** Present on progression-aware runs; optional only for typed legacy fixtures and migration boundaries. */
  progression?: CampaignMissionProgressionSnapshot;
  /** Reward eligibility is separate from interpreter health and can only transition from valid to invalid. */
  rewardIntegrity?: MissionRunIntegrityState;
  pendingEvents: CampaignMissionRuntimeEvent[];
  actionContinuations: Record<string, CampaignMissionActionContinuationState>;
  ownedResources: Record<string, CampaignMissionOwnedResourceRuntimeState>;
  integrity: CampaignMissionRuntimeIntegrity;
}
