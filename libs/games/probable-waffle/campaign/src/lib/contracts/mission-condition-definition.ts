import type {
  MissionCounterId,
  MissionEncounterId,
  MissionFactId,
  MissionObjectiveId,
  MissionPhaseId,
  MissionTimerId
} from "./campaign-content-id";

export type MissionNumericComparison =
  | "equal"
  | "not-equal"
  | "less"
  | "less-or-equal"
  | "greater"
  | "greater-or-equal";

export type MissionConditionDefinition =
  | { readonly kind: "always" }
  | { readonly kind: "never" }
  | { readonly kind: "all"; readonly conditions: readonly MissionConditionDefinition[] }
  | { readonly kind: "any"; readonly conditions: readonly MissionConditionDefinition[] }
  | { readonly kind: "not"; readonly condition: MissionConditionDefinition }
  | { readonly kind: "fact"; readonly factId: MissionFactId; readonly equals: boolean | string }
  | {
      readonly kind: "counter";
      readonly counterId: MissionCounterId;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
    }
  | { readonly kind: "timer"; readonly timerId: MissionTimerId; readonly state: "running" | "paused" | "elapsed" }
  | {
      readonly kind: "objective";
      readonly objectiveId: MissionObjectiveId;
      readonly state: "hidden" | "active" | "completed" | "failed" | "impossible";
    }
  | { readonly kind: "phase"; readonly phaseId: MissionPhaseId; readonly state: "active" | "completed" }
  | {
      readonly kind: "encounter";
      readonly encounterId: MissionEncounterId;
      readonly state: "inactive" | "active" | "completed" | "failed";
    };
