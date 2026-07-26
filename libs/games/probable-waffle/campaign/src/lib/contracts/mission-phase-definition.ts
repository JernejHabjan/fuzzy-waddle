import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";
import type { MissionPhaseId, MissionTransitionId } from "./campaign-content-id";
import type { MissionTriggerDefinition } from "./mission-trigger-definition";

/**
 * Defines the structured mission transition definition contract for this module. Its declared surface makes
 * id, target phase ids, condition, actions, priority explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionTransitionDefinition {
  /**
   * stable id used by {@link MissionTransitionDefinition} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: MissionTransitionId;
  /**
   * collection owned by {@link MissionTransitionDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly targetPhaseIds: readonly MissionPhaseId[];
  /**
   * condition value carried by {@link MissionTransitionDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly condition: MissionConditionDefinition;
  /**
   * collection owned by {@link MissionTransitionDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly actions: readonly MissionActionDefinition[];
  /**
   * numeric priority carried by {@link MissionTransitionDefinition}. Its units and valid range are defined by
   * {@link MissionTransitionDefinition} and must remain consistent across producers and consumers.
   */
  readonly priority: number;
}

/**
 * Defines the structured mission phase definition contract for this module. Its declared surface makes id,
 * mode, entry actions, exit actions, triggers explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionPhaseDefinition {
  /**
   * stable id used by {@link MissionPhaseDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionPhaseId;
  /**
   * discriminator for {@link MissionPhaseDefinition}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly mode: "sequential" | "parallel";
  /**
   * collection owned by {@link MissionPhaseDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly entryActions: readonly MissionActionDefinition[];
  /**
   * collection owned by {@link MissionPhaseDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly exitActions: readonly MissionActionDefinition[];
  /**
   * collection value on {@link MissionPhaseDefinition}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly triggers: readonly MissionTriggerDefinition[];
  /**
   * collection value on {@link MissionPhaseDefinition}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly transitions: readonly MissionTransitionDefinition[];
}
