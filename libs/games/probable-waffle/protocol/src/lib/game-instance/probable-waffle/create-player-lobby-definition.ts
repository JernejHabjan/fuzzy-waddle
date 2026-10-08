import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { PlayerLobbyDefinition } from "./player-lobby-definition";

/**
 * Creates a PlayerLobbyDefinition with default values.
 * This centralizes player lobby definition creation to avoid duplication.
 *
 * @param playerNumber - The player number (1-8)
 * @param playerPosition - The player position (defaults to playerNumber - 1 if not provided)
 * @param playerName - The player name (defaults to "Player {playerNumber}" if not provided)
 * @returns A PlayerLobbyDefinition object
 */
export function createPlayerLobbyDefinition(
  playerNumber: PlayerNumber,
  playerPosition?: number,
  playerName?: string
): PlayerLobbyDefinition {
  return {
    playerNumber,
    playerName: playerName ?? `Player ${playerNumber}`,
    playerPosition: playerPosition ?? playerNumber - 1,
    joined: true
  };
}
