import type { MissionConditionDefinition } from "./mission-condition-definition";
import type {
  MissionCounterId,
  MissionDialogueLineId,
  MissionObjectiveChecklistId,
  MissionObjectiveId,
  MissionParticipantSlotId,
  MissionRewardId,
  MissionTextId,
  ScenarioActorId,
  ScenarioRegionId
} from "./campaign-content-id";
import type { CampaignObjectiveKind } from "./campaign-content-kinds";

/**
 * Defines the structured mission objective checklist definition contract for this module. Its declared surface
 * makes id, text id, complete, progress, input prompt explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionObjectiveChecklistDefinition {
  /**
   * stable id used by {@link MissionObjectiveChecklistDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly id: MissionObjectiveChecklistId;
  /**
   * stable text id used by {@link MissionObjectiveChecklistDefinition} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly textId: MissionTextId;
  /**
   * complete value carried by {@link MissionObjectiveChecklistDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly complete: MissionConditionDefinition;
  /**
   * Optional progress value carried by {@link MissionObjectiveChecklistDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly progress?: MissionObjectiveCounterProgressDefinition;
  /**
   * Optional input prompt value carried by {@link MissionObjectiveChecklistDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly inputPrompt?: MissionInputPromptDefinition;
}

/**
 * Defines the structured mission objective counter progress definition contract for this module. Its declared
 * surface makes counter id, target, display explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionObjectiveCounterProgressDefinition {
  /**
   * stable counter id used by {@link MissionObjectiveCounterProgressDefinition} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly counterId: MissionCounterId;
  /**
   * numeric bound or quantity carried by {@link MissionObjectiveCounterProgressDefinition}. Interpret it in the
   * owning contract’s units and preserve its validation constraints at boundaries.
   */
  readonly target: number;
  /**
   * display value carried by {@link MissionObjectiveCounterProgressDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly display: "count" | "percentage";
}

/**
 * Defines the closed mission semantic input action value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionSemanticInputAction =
  | "camera.pan"
  | "selection.primary"
  | "command.move"
  | "command.attack"
  | "command.carry"
  | "interaction.primary";

/**
 * Defines the structured mission input prompt definition contract for this module. Its declared surface makes
 * action, seen policy explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionInputPromptDefinition {
  /**
   * action value carried by {@link MissionInputPromptDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly action: MissionSemanticInputAction;
  /**
   * Optional discriminator for {@link MissionInputPromptDefinition}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly seenPolicy?: "show" | "collapse";
}

/**
 * Defines the closed mission objective focus definition value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionObjectiveFocusDefinition =
  | { readonly kind: "actor"; readonly actorId: ScenarioActorId }
  | { readonly kind: "region"; readonly regionId: ScenarioRegionId };

/**
 * Defines the structured mission objective narration policy contract for this module. Its declared surface
 * makes reveal line id, completion line id, failure line id explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionObjectiveNarrationPolicy {
  /**
   * Optional stable reveal line id used by {@link MissionObjectiveNarrationPolicy} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly revealLineId?: MissionDialogueLineId;
  /**
   * Optional stable completion line id used by {@link MissionObjectiveNarrationPolicy} to correlate this value
   * with related records, events, or authored content; it is not a display label.
   */
  readonly completionLineId?: MissionDialogueLineId;
  /**
   * Optional stable failure line id used by {@link MissionObjectiveNarrationPolicy} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly failureLineId?: MissionDialogueLineId;
}

/**
 * Defines the structured mission objective display policy contract for this module. Its declared surface makes
 * announce reveal, announce completion, announce failure, announce impossible, show in tracker explicit to
 * every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers
 * remain compatible.
 */
export interface MissionObjectiveDisplayPolicy {
  /**
   * announce reveal value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly announceReveal: boolean;
  /**
   * announce completion value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly announceCompletion: boolean;
  /**
   * Optional announce failure value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly announceFailure?: boolean;
  /**
   * Optional announce impossible value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  readonly announceImpossible?: boolean;
  /**
   * show in tracker value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly showInTracker: boolean;
  /**
   * Optional narration value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly narration?: MissionObjectiveNarrationPolicy;
  /**
   * Optional focus value carried by {@link MissionObjectiveDisplayPolicy}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly focus?: MissionObjectiveFocusDefinition;
}

/**
 * Defines the structured mission objective definition contract for this module. Its declared surface makes id,
 * kind, ownership, title text id, description text id explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionObjectiveDefinition {
  /**
   * stable id used by {@link MissionObjectiveDefinition} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: MissionObjectiveId;
  /**
   * discriminator for {@link MissionObjectiveDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: CampaignObjectiveKind;
  /** Documents the ownership member and its declared contract at this boundary. */
  readonly ownership?:
    | { readonly kind: "shared" }
    | { readonly kind: "individual"; readonly slotId: MissionParticipantSlotId };
  /**
   * stable title text id used by {@link MissionObjectiveDefinition} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly titleTextId: MissionTextId;
  /**
   * Optional stable description text id used by {@link MissionObjectiveDefinition} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly descriptionTextId?: MissionTextId;
  /**
   * reveal value carried by {@link MissionObjectiveDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly reveal: MissionConditionDefinition;
  /**
   * complete value carried by {@link MissionObjectiveDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly complete: MissionConditionDefinition;
  /**
   * Optional fail value carried by {@link MissionObjectiveDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly fail?: MissionConditionDefinition;
  /**
   * Optional impossible value carried by {@link MissionObjectiveDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly impossible?: MissionConditionDefinition;
  /**
   * Optional collection owned by {@link MissionObjectiveDefinition}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly dependsOnObjectiveIds?: readonly MissionObjectiveId[];
  /**
   * Optional collection value on {@link MissionObjectiveDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly checklist?: readonly MissionObjectiveChecklistDefinition[];
  /**
   * Optional collection owned by {@link MissionObjectiveDefinition}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly rewardIds?: readonly MissionRewardId[];
  /**
   * display value carried by {@link MissionObjectiveDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly display: MissionObjectiveDisplayPolicy;
}
