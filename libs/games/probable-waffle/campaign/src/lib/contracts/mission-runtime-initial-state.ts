import type { MissionCounterId, MissionFactId, MissionPhaseId, MissionTimerId } from "./campaign-content-id";

export interface MissionInitialFact {
  readonly id: MissionFactId;
  readonly value: boolean | string;
}

export interface MissionInitialCounter {
  readonly id: MissionCounterId;
  readonly value: number;
}

export interface MissionInitialTimer {
  readonly id: MissionTimerId;
  readonly durationTicks: number;
  readonly state: "running" | "paused";
}

export interface MissionRuntimeInitialState {
  readonly activePhaseIds: readonly MissionPhaseId[];
  readonly facts: readonly MissionInitialFact[];
  readonly counters: readonly MissionInitialCounter[];
  readonly timers: readonly MissionInitialTimer[];
}
