import { ChangeDetectorRef, Component, inject, ViewChild } from "@angular/core";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import { PositionPlayerDefinition, ProbableWaffleGameModeLobby } from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { Router } from "@angular/router";
import { MapPlayerDefinition } from "./map-player-definition";

@Component({
  selector: "probable-waffle-lobby",
  templateUrl: "./lobby.component.html",
  styleUrls: ["./lobby.component.scss"]
})
export class LobbyComponent {
  @ViewChild("mapDefinition") private mapDefinition!: MapDefinitionComponent;
  protected selectedMap?: MapPlayerDefinition;
  private gameModeLobby?: ProbableWaffleGameModeLobby;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);

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
    this.selectedMap.playerPositions.forEach(this.aiPlayerAdded);
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
      difficultyModifiers: lobby.difficultyModifiers,
      maxPlayers: map.allPlayerPositions.length
    });
  }

  protected aiPlayerAdded = async (positionPlayerDefinition: PositionPlayerDefinition) => {
    this.playerCountChanged();
    await this.gameInstanceClientService.addSelfOrAiPlayer(positionPlayerDefinition);
  };

  protected async playerSlotOpened(playerDefinition: PositionPlayerDefinition) {
    this.playerCountChanged();
    await this.gameInstanceClientService.playerSlotOpened(playerDefinition);
  }

  protected async playerRemoved(positionPlayerDefinition: PositionPlayerDefinition) {
    this.mapDefinition.removePlayer(positionPlayerDefinition.player.playerNumber);
    this.playerCountChanged();
    await this.gameInstanceClientService.playerLeftOrSlotClosed(positionPlayerDefinition.player.playerNumber);
  }

  protected async startGame() {
    await this.gameInstanceClientService.startGame();
    await this.router.navigate(["probable-waffle/game"]);
  }

  protected get joinable(): boolean {
    return this.gameInstanceClientService.gameInstance?.gameInstanceMetadata!.data.joinable ?? false;
  }
}
