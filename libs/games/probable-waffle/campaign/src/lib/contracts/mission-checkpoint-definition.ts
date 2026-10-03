import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionCheckpointId, MissionCinematicId, MissionTextId } from "./campaign-content-id";
import type { MissionConditionDefinition } from "./mission-condition-definition";

/**
 * Defines the structured mission checkpoint definition contract for this module. Its declared surface makes
 * id, title text id, trigger, required actions, save policy explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionCheckpointDefinition {
  /**
   * stable id used by {@link MissionCheckpointDefinition} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: MissionCheckpointId;
  /**
   * stable title text id used by {@link MissionCheckpointDefinition} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly titleTextId: MissionTextId;
  /**
   * trigger value carried by {@link MissionCheckpointDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly trigger: MissionConditionDefinition;
  /**
   * collection owned by {@link MissionCheckpointDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly requiredActions: readonly MissionActionDefinition[];
  /**
   * discriminator for {@link MissionCheckpointDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly savePolicy: "when-stable" | "post-cinematic";
  /**
   * Optional collection owned by {@link MissionCheckpointDefinition}. Preserve the declared element contract and
   * any ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly retryCleanupActions?: readonly MissionActionDefinition[];
  /**
   * Optional keyed/nested resume presentation structure owned by {@link MissionCheckpointDefinition}. Keep its
   * keys and value contract explicit so callers cannot smuggle a broader shape across this boundary.
   */
  readonly resumePresentation?: {
    /**
     * Optional stable text id used by {@link MissionCheckpointDefinition} to correlate this value with related
     * records, events, or authored content; it is not a display label.
     */
    readonly textId?: MissionTextId;
    /**
     * Optional stable cinematic id used by {@link MissionCheckpointDefinition} to correlate this value with
     * related records, events, or authored content; it is not a display label.
     */
    readonly cinematicId?: MissionCinematicId;
  };
}
