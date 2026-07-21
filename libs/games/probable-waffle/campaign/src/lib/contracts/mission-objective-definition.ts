import type { MissionConditionDefinition } from "./mission-condition-definition";
import type {
  MissionObjectiveChecklistId,
  MissionObjectiveId,
  MissionRewardId,
  MissionTextId
} from "./campaign-content-id";
import type { CampaignObjectiveKind } from "./campaign-content-kinds";

export interface MissionObjectiveChecklistDefinition {
  readonly id: MissionObjectiveChecklistId;
  readonly textId: MissionTextId;
  readonly complete: MissionConditionDefinition;
}

export interface MissionObjectiveDisplayPolicy {
  readonly announceReveal: boolean;
  readonly announceCompletion: boolean;
  readonly showInTracker: boolean;
}

export interface MissionObjectiveDefinition {
  readonly id: MissionObjectiveId;
  readonly kind: CampaignObjectiveKind;
  readonly titleTextId: MissionTextId;
  readonly descriptionTextId?: MissionTextId;
  readonly reveal: MissionConditionDefinition;
  readonly complete: MissionConditionDefinition;
  readonly fail?: MissionConditionDefinition;
  readonly checklist?: readonly MissionObjectiveChecklistDefinition[];
  readonly rewardIds?: readonly MissionRewardId[];
  readonly display: MissionObjectiveDisplayPolicy;
}
