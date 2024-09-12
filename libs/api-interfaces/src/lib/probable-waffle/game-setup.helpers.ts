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
    const hue = (playerNumber / totalPlayers) * 360;
    const saturation = 100;
    const lightness = 50;
    return { hue, saturation, lightness };
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
    // iterate from 0 to players.length and find first number that doesn't exist in playerPositions
    for (let i = 0; i < players.length; i++) {
      if (!playerNumbers.includes(i)) {
        return i;
      }
    }
    return players.length;
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
