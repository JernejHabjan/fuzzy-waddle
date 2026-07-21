import type { CampaignId, CampaignMissionId } from "./campaign";

export const CAMPAIGN_MISSION_RUNTIME_SCHEMA_VERSION = 1 as const;

export type CampaignMissionRuntimeStatus = "initializing" | "running" | "victory" | "defeat" | "failed";
export type CampaignMissionObjectiveStatus = "hidden" | "active" | "completed" | "failed" | "impossible";
export type CampaignMissionEncounterStatus = "inactive" | "active" | "completed" | "failed";
export type CampaignMissionTimerStatus = "running" | "paused" | "elapsed" | "cancelled";

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
}

export interface CampaignMissionTimerRuntimeState {
  durationTicks: number;
  remainingTicks: number;
  status: CampaignMissionTimerStatus;
  startedAtTick?: number;
}

export interface CampaignMissionObjectiveRuntimeState {
  status: CampaignMissionObjectiveStatus;
  updatedAtTick: number;
}

export interface CampaignMissionTriggerRuntimeState {
  firedCount: number;
  lastCondition: boolean;
  lastFiredTick?: number;
}

export interface CampaignMissionRuntimeDiagnostic {
  code: "action-budget-exceeded" | "transition-budget-exceeded" | "invalid-runtime-state";
  message: string;
  tick: number;
  sourceId?: string;
}

export interface CampaignMissionRuntimeTraceEntry {
  tick: number;
  kind: "action" | "phase-entered" | "phase-completed" | "objective-changed" | "outcome-requested" | "diagnostic";
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
  activePhaseIds: string[];
  completedPhaseIds: string[];
  pendingPhaseIds: string[];
  facts: Record<string, boolean | string>;
  counters: Record<string, number>;
  timers: Record<string, CampaignMissionTimerRuntimeState>;
  objectives: Record<string, CampaignMissionObjectiveRuntimeState>;
  encounters: Record<string, CampaignMissionEncounterStatus>;
  claimedTriggerIds: string[];
  triggerStates: Record<string, CampaignMissionTriggerRuntimeState>;
  claimedRewardIds: string[];
  pendingEvents: CampaignMissionRuntimeEvent[];
  integrity: CampaignMissionRuntimeIntegrity;
}
