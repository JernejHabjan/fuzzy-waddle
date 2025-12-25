import { ProbableWafflePlayer, ProbableWafflePlayerType } from "../game-instance/probable-waffle/player";

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
      sessionColors = this.seededShuffle(sessionColors, gameInstanceId);
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

  /**
   * Shuffles an array based on a string seed so the result is
   * the same for everyone with the same gameInstanceId.
   */
  private static seededShuffle(array: any[], seed: string): any[] {
    const result = [...array];

    // Create a simple numeric hash from the string
    let seedNum = 0;
    for (let i = 0; i < seed.length; i++) {
      seedNum = (seedNum << 5) - seedNum + seed.charCodeAt(i);
      seedNum |= 0; // Convert to 32bit integer
    }

    // Linear Congruential Generator (standard seeded random math)
    const random = () => {
      seedNum = (seedNum * 1664525 + 1013904223) % 4294967296;
      return seedNum / 4294967296;
    };

    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
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
