import type { FactionType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, MissionTeamId } from "./campaign-content-id";

/**
 * Defines the structured mission participant definition contract for this module. Its declared surface makes
 * slot id, controller, single player substitution, faction, team id explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionParticipantDefinition {
  /**
   * stable slot id used by {@link MissionParticipantDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly slotId: MissionParticipantSlotId;
  /**
   * controller value carried by {@link MissionParticipantDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly controller: "human" | "full-ai" | "scripted-ai" | "passive";
  /** Documents the single player substitution member and its declared contract at this boundary. */
  readonly singlePlayerSubstitution?: "absent" | "scripted-ai" | "full-ai";
  /**
   * faction value carried by {@link MissionParticipantDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly faction: FactionType;
  /**
   * stable team id used by {@link MissionParticipantDefinition} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly teamId: MissionTeamId;
  /**
   * Optional required for victory value carried by {@link MissionParticipantDefinition}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  readonly requiredForVictory?: boolean;
  /**
   * Optional profile ownership value carried by {@link MissionParticipantDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly profileOwnership?: "independent" | "none";
  /**
   * economy value carried by {@link MissionParticipantDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly economy: "normal" | "granted" | "none";
  /**
   * discriminator for {@link MissionParticipantDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly fogPolicy: "normal" | "revealed" | "omniscient-ai";
  /**
   * Optional starting resources value carried by {@link MissionParticipantDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly startingResources?: Readonly<Partial<Record<ResourceType, number>>>;
}
