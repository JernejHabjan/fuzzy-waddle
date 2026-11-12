import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { PlayerLobbyDefinition } from "./player-lobby-definition";
import type { FactionType } from "./faction-type";
import type { ProbableWafflePlayerType } from "./probable-waffle-player-type";
import type { ProbableWaffleAiDifficulty } from "./probable-waffle-ai-difficulty";

/**
 * Defines the structured position player definition contract for this module. Its declared surface makes
 * initial world logical spawn position, player, team, faction type, player type explicit to every consumer.
 * Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface PositionPlayerDefinition {
  // assigned only after entering the game in world space coordinates
  /**
   * Optional initial world logical spawn position value carried by {@link PositionPlayerDefinition}. Its
   * declared type is the compatibility boundary for producers, validators, and consumers; do not replace it with
   * a broader inferred shape.
   */
  initialWorldLogicalSpawnPosition?: Vector3Simple;
  /**
   * player value carried by {@link PositionPlayerDefinition}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  player: PlayerLobbyDefinition;
  /**
   * Optional numeric team carried by {@link PositionPlayerDefinition}. Its units and valid range are defined by
   * {@link PositionPlayerDefinition} and must remain consistent across producers and consumers.
   */
  team?: number;
  /**
   * Optional discriminator for {@link PositionPlayerDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  factionType?: FactionType;
  /**
   * discriminator for {@link PositionPlayerDefinition}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  playerType: ProbableWafflePlayerType;
  /**
   * Optional difficulty value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  difficulty?: ProbableWaffleAiDifficulty;
  /**
   * Optional campaign controller value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaignController?: "full-ai" | "scripted-ai" | "passive";
  /**
   * Optional campaign economy value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaignEconomy?: "normal" | "granted" | "none";
  /**
   * Optional discriminator for {@link PositionPlayerDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  campaignFogPolicy?: "normal" | "revealed" | "omniscient-ai";
  /**
   * Optional campaign starting resources value carried by {@link PositionPlayerDefinition}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  campaignStartingResources?: Partial<Record<ResourceType, number>>;
  /**
   * Optional numeric bound or quantity carried by {@link PositionPlayerDefinition}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  campaignDamageScale?: number;
  /**
   * Optional numeric bound or quantity carried by {@link PositionPlayerDefinition}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  campaignAiAggressionScale?: number;
  /**
   * Optional campaign ai enabled value carried by {@link PositionPlayerDefinition}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaignAiEnabled?: boolean;
}
