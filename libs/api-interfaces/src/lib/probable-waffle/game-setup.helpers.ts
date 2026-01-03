import { ProbableWafflePlayer, ProbableWafflePlayerType } from "../game-instance/probable-waffle/player";
import { Math as PhaserMath } from "phaser";

export class GameSetupHelpers {
  private static colors = [
    { hue: 215, saturation: 60, lightness: 50 }, // Steel Blue
    { hue: 15, saturation: 65, lightness: 50 }, // Burnt Sienna
    { hue: 190, saturation: 60, lightness: 45 }, // Deep Cyan
    { hue: 45, saturation: 70, lightness: 50 }, // Desert Sand / Ochre
    { hue: 280, saturation: 50, lightness: 55 }, // Muted Amethyst
    { hue: 35, saturation: 75, lightness: 45 }, // Copper Orange
    { hue: 210, saturation: 70, lightness: 40 }, // Midnight Indigo (Replacing the near-white Sky Blue)
    { hue: 335, saturation: 60, lightness: 50 } // Crimson Rose
  ];

  public static getStringColorForPlayer(
    playerNumber: number,
    totalPlayers: number = 8,
    gameInstanceId: string | undefined
  ): string {
    const { hue, saturation, lightness } = this.getHslColorForPlayer(playerNumber, totalPlayers, gameInstanceId);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  public static getHslColorForPlayer(
    playerNumber: number,
    totalPlayers: number = 8,
    gameInstanceId: string | undefined
  ): {
    hue: number;
    saturation: number;
    lightness: number;
  } {
    if (playerNumber === 0 || playerNumber === undefined) throw new Error("Player number must be 1 or higher");
    // 1. Start with the default order
    let sessionColors = [...this.colors];

    // 2. If a seed is provided, shuffle the array deterministically
    if (gameInstanceId) {
      const seededRng = new PhaserMath.RandomDataGenerator([gameInstanceId]);
      sessionColors = seededRng.shuffle(sessionColors);
    }

    // 3. Return the color based on player number (1-indexed)
    const colors = sessionColors[(playerNumber - 1) % sessionColors.length]!;
    if (!colors) {
      console.error(
        `No color found for player number ${playerNumber}. Total players: ${totalPlayers}, GameInstanceId: ${gameInstanceId}`
      );
      throw new Error("Color not found for player");
    }
    return colors;
  }

  public static getFirstFreePosition(players: ProbableWafflePlayer[]) {
    const playerPositions = players.map((p) => p.playerController.data.playerDefinition!.player.playerPosition);
    // iterate from 0 to players.length and find first number that doesn't exist in playerPositions
    for (let i = 0; i < players.length; i++) {
      if (!playerPositions.includes(i)) {
        return i;
      }
    }
    return players.length;
  }

  public static getFirstFreePlayerNumber(players: ProbableWafflePlayer[]) {
    const playerNumbers = players.map((p) => p.playerNumber);
    // iterate from 1 to players.length+1 and find first number that doesn't exist in playerPositions
    for (let i = 1; i < players.length + 1; i++) {
      if (!playerNumbers.includes(i)) {
        return i;
      }
    }
    return players.length + 1;
  }

  static getFirstNetworkOpenPlayer(players: ProbableWafflePlayer[]): ProbableWafflePlayer | null {
    // noinspection UnnecessaryLocalVariableJS
    const player =
      players.find(
        (p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.NetworkOpen
      ) ?? null;
    return player;
  }
}
