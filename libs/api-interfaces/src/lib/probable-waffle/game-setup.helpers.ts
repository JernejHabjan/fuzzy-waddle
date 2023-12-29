export class GameSetupHelpers {
  public static getColorForPlayer(playerIndex: number, totalPlayers: number): string {
    const hue = (playerIndex / totalPlayers) * 360;
    const saturation = 100;
    const lightness = 50;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}
