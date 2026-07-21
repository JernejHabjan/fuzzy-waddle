import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionCheckpointId, MissionTextId } from "./campaign-content-id";
import type { MissionConditionDefinition } from "./mission-condition-definition";

export interface MissionCheckpointDefinition {
  readonly id: MissionCheckpointId;
  readonly titleTextId: MissionTextId;
  readonly trigger: MissionConditionDefinition;
  readonly requiredActions: readonly MissionActionDefinition[];
  readonly savePolicy: "when-stable" | "post-cinematic";
}
