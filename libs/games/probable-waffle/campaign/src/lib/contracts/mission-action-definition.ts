import type {
  MissionActionId,
  MissionCounterId,
  MissionFactId,
  MissionReasonId,
  MissionTimerId,
  MissionTrustedHookId
} from "./campaign-content-id";

export type MissionActionMissingReferencePolicy = "fail-mission" | "skip" | "wait" | "fallback";

interface MissionActionDefinitionBase {
  readonly id: MissionActionId;
  readonly scope?: "phase" | "mission";
  readonly missingReferencePolicy?: MissionActionMissingReferencePolicy;
}

export type MissionActionDefinition =
  | (MissionActionDefinitionBase & {
      readonly kind: "set-fact";
      readonly factId: MissionFactId;
      readonly value: boolean | string;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-counter";
      readonly counterId: MissionCounterId;
      readonly value: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "increment-counter";
      readonly counterId: MissionCounterId;
      readonly amount: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "start-timer";
      readonly timerId: MissionTimerId;
      readonly durationTicks: number;
    })
  | (MissionActionDefinitionBase & { readonly kind: "pause-timer"; readonly timerId: MissionTimerId })
  | (MissionActionDefinitionBase & { readonly kind: "cancel-timer"; readonly timerId: MissionTimerId })
  | (MissionActionDefinitionBase & {
      readonly kind: "request-outcome";
      readonly outcome: "victory" | "defeat";
      readonly reasonId: MissionReasonId;
    })
  | (MissionActionDefinitionBase & { readonly kind: "trusted-hook"; readonly hookId: MissionTrustedHookId });
