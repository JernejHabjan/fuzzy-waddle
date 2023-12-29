import {
  GameSetupHelpers,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleAiDifficulty,
  ProbableWaffleMapData,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";

export class MapPlayerDefinition {
  private startPositionPerPlayer: PositionPlayerDefinition[] = [];
  private allPossibleTeams: (number | null)[] = [];
  private initialNrAiPlayers = 0;

  constructor(public readonly map: ProbableWaffleMapData) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.mapInfo.startPositionsOnTile.length; i++) {
      const playerColor = GameSetupHelpers.getColorForPlayer(i, map.mapInfo.startPositionsOnTile.length);
      // use initialNrAiPlayers to set the first x players to AI
      const shouldAutoJoin = i < this.initialNrAiPlayers + 1; // 1 for self player
      const isAi = i > 0 && shouldAutoJoin;
      const playerName = isAi ? `AI ${i}` : i === 0 ? "You" : `Player ${i}`;
      this.startPositionPerPlayer.push(
        new PositionPlayerDefinition(
          new PlayerLobbyDefinition(i, playerName, shouldAutoJoin ? i : null, shouldAutoJoin),
          null,
          null,
          !isAi ? ProbableWafflePlayerType.Human : ProbableWafflePlayerType.AI,
          playerColor,
          isAi ? ProbableWaffleAiDifficulty.Medium : null
        )
      );
      this.allPossibleTeams.push(i);
    }
  }

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => positionPlayer.player.playerPosition !== null);
  }

  get allPlayerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer;
  }

  get allTeams(): (number | null)[] {
    return this.allPossibleTeams;
  }
}
