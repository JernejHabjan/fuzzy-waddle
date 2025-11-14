import { ProbableWafflePlayer, ProbableWafflePlayerType } from "../game-instance/probable-waffle/player";

export class GameSetupHelpers {
  public static getStringColorForPlayer(playerNumber: number, totalPlayers: number = 8): string {
    const { hue, saturation, lightness } = this.getHslColorForPlayer(playerNumber, totalPlayers);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  public static getHslColorForPlayer(
    playerNumber: number,
    totalPlayers: number = 8
  ): {
    hue: number;
    saturation: number;
    lightness: number;
  } {
    // Not using spectrum as it can produce very bright/neon colors that are hard to look at for long periods
    // const hue = (playerNumber / totalPlayers) * 360;
    // const saturation = 100;
    // const lightness = 50;
    // return { hue, saturation, lightness };

    const colors = [
      { hue: 210, saturation: 50, lightness: 50 }, // Soft blue
      { hue: 25, saturation: 65, lightness: 55 }, // Warm orange
      { hue: 120, saturation: 35, lightness: 45 }, // Muted green
      { hue: 280, saturation: 35, lightness: 55 }, // Lavender/purple
      { hue: 0, saturation: 45, lightness: 50 }, // Muted red
      { hue: 50, saturation: 50, lightness: 55 }, // Warm yellow-gold
      { hue: 190, saturation: 40, lightness: 50 }, // Teal-cyan
      { hue: 330, saturation: 35, lightness: 55 } // Soft pink-magenta
    ];

    return colors[playerNumber % colors.length]!;
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
