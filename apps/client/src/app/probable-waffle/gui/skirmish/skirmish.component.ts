import { ChangeDetectorRef, Component, inject, OnInit, ViewChild } from "@angular/core";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import {
  ProbableWaffleAiDifficulty,
  ProbableWafflePlayerType,
  ProbableWaffleGameModeLobby,
  ProbableWaffleMapData,
  PositionPlayerDefinition,
  PlayerLobbyDefinition
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { Router } from "@angular/router";

export class MapPlayerDefinition {
  public startPositionPerPlayer: PositionPlayerDefinition[] = [];
  protected allPossibleTeams: (number | null)[] = [];
  private initialNrAiPlayers = 0;

  constructor(public readonly map: ProbableWaffleMapData) {
    this.allPossibleTeams.push(null);
    for (let i = 0; i < map.mapInfo.startPositionsOnTile.length; i++) {
      const playerColor = `hsl(${(i * 360) / map.mapInfo.startPositionsOnTile.length}, 100%, 50%)`;
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

@Component({
  selector: "fuzzy-waddle-skirmish",
  templateUrl: "./skirmish.component.html",
  styleUrls: ["./skirmish.component.scss"]
})
export class SkirmishComponent implements OnInit {
  @ViewChild("mapDefinition") private mapDefinition!: MapDefinitionComponent;
  protected selectedMap?: MapPlayerDefinition;
  private gameModeLobby?: ProbableWaffleGameModeLobby;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    await this.gameInstanceClientService.createGameInstance(false);
  }

  protected playerCountChanged() {
    this.mapDefinition.initializePlayerPositions();
    this.mapDefinition.draw();
  }

  protected async mapChanged(newMap: MapPlayerDefinition) {
    const previousMap = this.selectedMap;

    if (previousMap) {
      // remove players that are not in the new map
      const previousMapPlayerPositions = previousMap?.playerPositions;
      const newMapPlayerPositions = newMap.playerPositions;

      const playerPositionsToRemove = previousMapPlayerPositions.filter(
        (previousMapPlayerPosition) => !newMapPlayerPositions.includes(previousMapPlayerPosition)
      );

      for (const playerPositionToRemove of playerPositionsToRemove) {
        await this.playerRemoved(playerPositionToRemove);
      }
    }

    this.selectedMap = newMap;
    this.cdr.detectChanges();
    await this.gameModeOrMapChanged();
    this.selectedMap.playerPositions.forEach(this.selfOrAiPlayerAdded);
  }

  protected async gameModeLobbyChanged($event: ProbableWaffleGameModeLobby) {
    this.gameModeLobby = $event;
    console.log("gameModeLobbyChanged", this.gameModeLobby);
    await this.gameModeOrMapChanged();
  }

  private async gameModeOrMapChanged() {
    const lobby = this.gameModeLobby;
    const map = this.selectedMap;
    if (!lobby || !map) return;
    await this.gameInstanceClientService.gameModeChanged({
      map: map.map.id,
      mapTuning: lobby.mapTuning,
      winConditions: lobby.winConditions,
      difficultyModifiers: lobby.difficultyModifiers
    });
  }

  protected selfOrAiPlayerAdded = async (positionPlayerDefinition: PositionPlayerDefinition) => {
    this.playerCountChanged();
    await this.gameInstanceClientService.addSelfOrAiPlayer(positionPlayerDefinition);
  };

  protected async playerSlotOpened() {
    this.playerCountChanged();
    await this.gameInstanceClientService.playerSlotOpened();
  }

  protected async playerRemoved(positionPlayerDefinition: PositionPlayerDefinition) {
    this.mapDefinition.removePlayer(positionPlayerDefinition.player.playerNumber);
    this.playerCountChanged();
    await this.gameInstanceClientService.playerLeft(positionPlayerDefinition.player.playerNumber);
  }

  protected async startGame() {
    await this.gameInstanceClientService.startGame();
    await this.router.navigate(["probable-waffle/game"]);
  }
}
