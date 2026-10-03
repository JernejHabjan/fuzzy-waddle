import type { MissionActionDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";
import type { MissionTriggerId } from "./campaign-content-id";
import type { MissionTriggerParticipantPolicy } from "./mission-coop-override";

/**
 * Defines the closed mission trigger firing policy value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionTriggerFiringPolicy =
  | { readonly kind: "once" }
  | { readonly kind: "repeatable"; readonly cooldownTicks: number }
  | { readonly kind: "edge" }
  | { readonly kind: "while"; readonly cadenceTicks: number };

/**
 * Defines the structured mission trigger definition contract for this module. Its declared surface makes id,
 * kind, event kinds, condition, actions explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionTriggerDefinition {
  /**
   * stable id used by {@link MissionTriggerDefinition} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionTriggerId;
  /**
   * discriminator for {@link MissionTriggerDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "event" | "condition";
  /**
   * Optional collection value on {@link MissionTriggerDefinition}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly eventKinds?: readonly string[];
  /**
   * condition value carried by {@link MissionTriggerDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly condition: MissionConditionDefinition;
  /**
   * collection owned by {@link MissionTriggerDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly actions: readonly MissionActionDefinition[];
  /**
   * firing value carried by {@link MissionTriggerDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly firing: MissionTriggerFiringPolicy;
  /** Documents the participant policy member and its declared contract at this boundary. */
  readonly participantPolicy?: MissionTriggerParticipantPolicy;
  /**
   * numeric priority carried by {@link MissionTriggerDefinition}. Its units and valid range are defined by
   * {@link MissionTriggerDefinition} and must remain consistent across producers and consumers.
   */
  readonly priority: number;
}
