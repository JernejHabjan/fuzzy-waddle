import type { MissionConditionDefinition } from "./mission-condition-definition";
import type {
  MissionCounterId,
  MissionDialogueLineId,
  MissionObjectiveChecklistId,
  MissionObjectiveId,
  MissionRewardId,
  ScenarioActorId,
  ScenarioRegionId,
  MissionTextId
} from "./campaign-content-id";
import type { CampaignObjectiveKind } from "./campaign-content-kinds";

export interface MissionObjectiveChecklistDefinition {
  readonly id: MissionObjectiveChecklistId;
  readonly textId: MissionTextId;
  readonly complete: MissionConditionDefinition;
  readonly progress?: MissionObjectiveCounterProgressDefinition;
  readonly inputPrompt?: MissionInputPromptDefinition;
}

export interface MissionObjectiveCounterProgressDefinition {
  readonly counterId: MissionCounterId;
  readonly target: number;
  readonly display: "count" | "percentage";
}

export type MissionSemanticInputAction =
  | "camera.pan"
  | "selection.primary"
  | "command.move"
  | "command.attack"
  | "command.carry"
  | "interaction.primary";

export interface MissionInputPromptDefinition {
  readonly action: MissionSemanticInputAction;
  readonly seenPolicy?: "show" | "collapse";
}

export type MissionObjectiveFocusDefinition =
  | { readonly kind: "actor"; readonly actorId: ScenarioActorId }
  | { readonly kind: "region"; readonly regionId: ScenarioRegionId };

export interface MissionObjectiveNarrationPolicy {
  readonly revealLineId?: MissionDialogueLineId;
  readonly completionLineId?: MissionDialogueLineId;
  readonly failureLineId?: MissionDialogueLineId;
}

export interface MissionObjectiveDisplayPolicy {
  readonly announceReveal: boolean;
  readonly announceCompletion: boolean;
  readonly announceFailure?: boolean;
  readonly announceImpossible?: boolean;
  readonly showInTracker: boolean;
  readonly narration?: MissionObjectiveNarrationPolicy;
  readonly focus?: MissionObjectiveFocusDefinition;
}

export interface MissionObjectiveDefinition {
  readonly id: MissionObjectiveId;
  readonly kind: CampaignObjectiveKind;
  readonly titleTextId: MissionTextId;
  readonly descriptionTextId?: MissionTextId;
  readonly reveal: MissionConditionDefinition;
  readonly complete: MissionConditionDefinition;
  readonly fail?: MissionConditionDefinition;
  readonly impossible?: MissionConditionDefinition;
  readonly dependsOnObjectiveIds?: readonly MissionObjectiveId[];
  readonly checklist?: readonly MissionObjectiveChecklistDefinition[];
  readonly rewardIds?: readonly MissionRewardId[];
  readonly display: MissionObjectiveDisplayPolicy;
}
