import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, MissionTeamId, ScenarioGroupId } from "./campaign-content-id";
import type { MissionParticipantDefinition } from "./mission-participant-definition";

/**
 * Defines the closed mission failure policy value set. Keeping this union named preserves exhaustive handling
 * and prevents incompatible free-form values at its boundaries.
 */
export type MissionFailurePolicy = "any-required-hero" | "all-required-heroes" | "team-eliminated" | "mission-defined";

/**
 * Defines the closed mission trigger participant policy value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionTriggerParticipantPolicy =
  | { readonly kind: "any-player" }
  | { readonly kind: "specific-slot"; readonly slotId: MissionParticipantSlotId }
  | { readonly kind: "specific-faction"; readonly faction: FactionType }
  | { readonly kind: "all-connected-humans" }
  | { readonly kind: "at-least"; readonly count: number }
  | { readonly kind: "entire-required-group"; readonly groupId: ScenarioGroupId };

/**
 * Defines the structured mission participant override contract for this module. Its declared surface makes
 * slot id, team id explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface MissionParticipantOverride extends Partial<Omit<MissionParticipantDefinition, "slotId">> {
  /**
   * stable slot id used by {@link MissionParticipantOverride} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly slotId: MissionParticipantSlotId;
  /**
   * Optional stable team id used by {@link MissionParticipantOverride} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly teamId?: MissionTeamId;
}

/**
 * Defines the structured mission player count override contract for this module. Its declared surface makes
 * participant count, wave size scale, resource scale explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionPlayerCountOverride {
  /**
   * numeric bound or quantity carried by {@link MissionPlayerCountOverride}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly participantCount: number;
  /**
   * Optional numeric bound or quantity carried by {@link MissionPlayerCountOverride}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly waveSizeScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link MissionPlayerCountOverride}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly resourceScale?: number;
}

/**
 * Defines the structured mission coop override contract for this module. Its declared surface makes schema
 * version, participants, player count difficulty, failure policy, disconnected player policy explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface MissionCoopOverride {
  /**
   * compatibility schema version for {@link MissionCoopOverride}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * collection owned by {@link MissionCoopOverride}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly participants: readonly MissionParticipantOverride[];
  /**
   * collection value on {@link MissionCoopOverride}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly playerCountDifficulty: readonly MissionPlayerCountOverride[];
  /**
   * discriminator for {@link MissionCoopOverride}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly failurePolicy: MissionFailurePolicy;
  /**
   * discriminator for {@link MissionCoopOverride}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly disconnectedPlayerPolicy: "pause-for-reconnect" | "mission-defined";
}
