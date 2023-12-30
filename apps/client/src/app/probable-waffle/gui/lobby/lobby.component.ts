import { Component, inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MapDefinitionComponent } from "./map-definition/map-definition.component";
import {
  PositionPlayerDefinition,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameModeLobby
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceClientService } from "../../communicators/game-instance-client.service";
import { Router } from "@angular/router";
import { MapPlayerDefinition } from "./map-player-definition";
import { MapPlayerDefinitionsService } from "./map-player-definitions.service";
import { Subscription } from "rxjs";

@Component({
  selector: "probable-waffle-lobby",
  templateUrl: "./lobby.component.html",
  styleUrls: ["./lobby.component.scss"]
})
export class LobbyComponent implements OnInit, OnDestroy {
  @ViewChild("mapDefinition") private mapDefinition!: MapDefinitionComponent;
  private gameModeLobby?: ProbableWaffleGameModeLobby;
  private readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);
  private readonly mapPlayerDefinitionsService = inject(MapPlayerDefinitionsService);
  private playerRemovedSubscription: Subscription | undefined;
  private gameModeOrMapChangedSubscription: Subscription | undefined;

  ngOnInit(): void {
    this.playerRemovedSubscription = this.mapPlayerDefinitionsService.playerRemoved.subscribe(this.playerRemoved);
    this.gameModeOrMapChangedSubscription = this.mapPlayerDefinitionsService.gameModeOrMapChanged.subscribe(
      this.gameModeOrMapChanged
    );
    this.mapPlayerDefinitionsService.init();
  }

  ngOnDestroy() {
    this.playerRemovedSubscription?.unsubscribe();
    this.gameModeOrMapChangedSubscription?.unsubscribe();
  }

  get selectedMap(): MapPlayerDefinition {
    return this.mapPlayerDefinitionsService.selectedMap!;
  }

  private refreshMap() {
    this.mapDefinition.refresh();
  }

  protected async gameModeLobbyChanged($event: ProbableWaffleGameModeLobby) {
    this.gameModeLobby = $event;
    console.log("gameModeLobbyChanged", this.gameModeLobby);
    await this.gameModeOrMapChanged();
  }

  private gameModeOrMapChanged = async () => {
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
  };

  protected aiPlayerAdded = async (positionPlayerDefinition: PositionPlayerDefinition) => {
    await this.gameInstanceClientService.addSelfOrAiPlayer(positionPlayerDefinition);
    this.refreshMap();
  };

  protected async playerSlotOpened(playerDefinition: PositionPlayerDefinition) {
    await this.gameInstanceClientService.playerSlotOpened(playerDefinition);
    this.refreshMap();
  }

  protected playerRemoved = async (positionPlayerDefinition: PositionPlayerDefinition) => {
    await this.gameInstanceClientService.playerLeftOrSlotClosed(positionPlayerDefinition.player.playerNumber);
    this.refreshMap();
  };

  protected async startGame() {
    await this.gameInstanceClientService.startGame();
    await this.router.navigate(["probable-waffle/game"]);
  }

  protected get isSelfHosted(): boolean {
    return (
      this.gameInstanceClientService.gameInstance?.gameInstanceMetadata!.data.type ===
        ProbableWaffleGameInstanceType.SelfHosted ?? false
    );
  }
}
