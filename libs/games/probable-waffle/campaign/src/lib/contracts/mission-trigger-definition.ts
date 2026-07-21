import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";
import type { MissionTriggerId } from "./campaign-content-id";

export type MissionTriggerFiringPolicy =
  | { readonly kind: "once" }
  | { readonly kind: "repeatable"; readonly cooldownTicks: number }
  | { readonly kind: "edge" }
  | { readonly kind: "while"; readonly cadenceTicks: number };

export interface MissionTriggerDefinition {
  readonly id: MissionTriggerId;
  readonly kind: "event" | "condition";
  readonly eventKinds?: readonly string[];
  readonly condition: MissionConditionDefinition;
  readonly actions: readonly MissionActionDefinition[];
  readonly firing: MissionTriggerFiringPolicy;
  readonly priority: number;
}
