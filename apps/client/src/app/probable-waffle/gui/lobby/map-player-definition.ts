import {
  GameSetupHelpers,
  PlayerLobbyDefinition,
  PositionPlayerDefinition,
  ProbableWaffleMapData,
  ProbableWafflePlayerType
} from "@fuzzy-waddle/api-interfaces";

export class MapPlayerDefinition {
  private startPositionPerPlayer: PositionPlayerDefinition[] = [];
  private allPossibleTeams: (number | null)[] = [];

  constructor(public readonly map: ProbableWaffleMapData) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.mapInfo.startPositionsOnTile.length; i++) {
      const playerColor = GameSetupHelpers.getColorForPlayer(i, map.mapInfo.startPositionsOnTile.length);
      const playerName = `Player ${i + 1}`;
      this.startPositionPerPlayer.push({
        player: {
          playerNumber: i,
          playerName: playerName,
          joined: false
        } satisfies PlayerLobbyDefinition,
        playerType: ProbableWafflePlayerType.Human,
        playerColor: playerColor
      } satisfies PositionPlayerDefinition);
      this.allPossibleTeams.push(i);
    }
  }

  get playerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer.filter((positionPlayer) => !!positionPlayer.player.playerPosition);
  }

  get allPlayerPositions(): PositionPlayerDefinition[] {
    return this.startPositionPerPlayer;
  }

  set allPlayerPositions(value: PositionPlayerDefinition[]) {
    this.startPositionPerPlayer = value;
  }

  get allTeams(): (number | null)[] {
    return this.allPossibleTeams;
  }
}
