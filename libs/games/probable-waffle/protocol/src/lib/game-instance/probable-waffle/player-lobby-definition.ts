import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";

/**
 * Defines the structured player lobby definition contract for this module. Its declared surface makes player
 * number, player name, player position, joined, ready explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface PlayerLobbyDefinition {
  /**
   * player number value carried by {@link PlayerLobbyDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  playerNumber: PlayerNumber;
  /**
   * Optional human-facing player name for {@link PlayerLobbyDefinition}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  playerName?: string;
  /**
   * Optional numeric player position carried by {@link PlayerLobbyDefinition}. Its units and valid range are
   * defined by {@link PlayerLobbyDefinition} and must remain consistent across producers and consumers.
   */
  playerPosition?: number;
  /**
   * joined value carried by {@link PlayerLobbyDefinition}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  joined: boolean;
  /**
   * Optional ready value carried by {@link PlayerLobbyDefinition}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  ready?: boolean;
}
