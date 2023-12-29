import { inject, Injectable } from "@angular/core";
import { PositionPlayerDefinition, ProbableWaffleLevels, ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { MapPlayerDefinition } from "./map-player-definition";
import { Subject } from "rxjs";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";

@Injectable({
  providedIn: "root"
})
export class MapPlayerDefinitionsService {
  private readonly defaultMap: ProbableWaffleMapEnum = ProbableWaffleMapEnum.RiverCrossing;
  mapPlayerDefinitions: MapPlayerDefinition[] = [];
  selectedMap: MapPlayerDefinition | null = null;
  playerRemoved = new Subject<PositionPlayerDefinition>();
  gameModeOrMapChanged = new Subject<void>();
  private readonly gameInstanceClientService = inject(GameInstanceClientService);

  init() {
    this.mapPlayerDefinitions = Object.values(ProbableWaffleLevels).map((map) => new MapPlayerDefinition(map));
    this.selectMap();
    this.populatePlayers();
  }

  /**
   * Select map from game instance - game mode or select default one
   */
  private selectMap() {
    const map = this.gameInstanceClientService.gameInstance?.gameMode?.data.map ?? this.defaultMap;
    this.selectedMap = this.mapPlayerDefinitions.find((mapPlayerDefinition) => mapPlayerDefinition.map.id === map)!;
    this.gameModeOrMapChanged.next();
  }

  private populatePlayers() {
    this.populatePlayersFromGameInstance();
  }

  private populatePlayersFromGameInstance() {
    const players = this.gameInstanceClientService.gameInstance?.players;
    if (!players || !players.length) return;
    // if players, add them

    const playerPositions = this.selectedMap!.allPlayerPositions;

    // replace positionPlayerDefinitions with definitions from game instance
    const newPlayerPositions: PositionPlayerDefinition[] = [];
    for (const playerPosition of playerPositions) {
      const player = players.find(
        (player) =>
          player.playerController.data.playerDefinition!.player.playerNumber === playerPosition.player.playerNumber
      );
      if (player) {
        newPlayerPositions.push(player.playerController.data.playerDefinition!);
      } else {
        newPlayerPositions.push(playerPosition);
      }
    }

    this.selectedMap!.allPlayerPositions = newPlayerPositions;
  }

  async set(newMap: MapPlayerDefinition) {
    const previousMap = this.selectedMap;

    if (previousMap) {
      // remove players that are not in the new map
      const previousMapPlayerPositions = previousMap?.playerPositions;
      const newMapPlayerPositions = newMap.allPlayerPositions;

      const toRemove = previousMapPlayerPositions.length - newMapPlayerPositions.length;
      if (toRemove > 0) {
        // remove last players
        const playerPositionsToRemove = previousMapPlayerPositions.slice(previousMapPlayerPositions.length - toRemove);

        for (const playerPositionToRemove of playerPositionsToRemove) {
          this.playerRemoved.next(playerPositionToRemove);
        }
      }
    }

    this.selectedMap = newMap;
    this.populatePlayers();
    this.gameModeOrMapChanged.next();
  }
}
