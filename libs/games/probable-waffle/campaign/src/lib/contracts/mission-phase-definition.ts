import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";
import type { MissionPhaseId, MissionTransitionId } from "./campaign-content-id";
import type { MissionTriggerDefinition } from "./mission-trigger-definition";

export interface MissionTransitionDefinition {
  readonly id: MissionTransitionId;
  readonly targetPhaseIds: readonly MissionPhaseId[];
  readonly condition: MissionConditionDefinition;
  readonly actions: readonly MissionActionDefinition[];
  readonly priority: number;
}

export interface MissionPhaseDefinition {
  readonly id: MissionPhaseId;
  readonly mode: "sequential" | "parallel";
  readonly entryActions: readonly MissionActionDefinition[];
  readonly exitActions: readonly MissionActionDefinition[];
  readonly triggers: readonly MissionTriggerDefinition[];
  readonly transitions: readonly MissionTransitionDefinition[];
}
