import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { flySquasherGameConfig } from "../game/consts/game-config";
import { FlySquasherGameInstance, FlySquasherLevels, FlySquasherUserInfo } from "@fuzzy-waddle/api-interfaces";
import { AuthService } from "../../auth/auth.service";
import { FlySquasherGameData } from "../game/fly-squasher-game-data";
import { FlySquasherCommunicatorService } from "../game/fly-squasher-communicator.service";
import { SceneCommunicatorClientService } from "./scene-communicator-client.service";

@Component({
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.scss"]
})
export class MainComponent implements OnInit, OnDestroy {
  protected readonly flySquasherGameConfig = flySquasherGameConfig;
  protected gameData!: FlySquasherGameData;
  @Input() level!: string;

  constructor(
    private readonly authService: AuthService,
    private readonly communicatorService: FlySquasherCommunicatorService,
    private readonly sceneCommunicatorClientService: SceneCommunicatorClientService
  ) {}

  ngOnInit(): void {
    const levelData = Object.values(FlySquasherLevels).find((level) => level.id === Number.parseInt(this.level))!;

    const gameSessionInstance = new FlySquasherGameInstance({
      gameModeData: {
        level: levelData
      }
    });
    this.gameData = {
      gameInstance: gameSessionInstance,
      communicator: this.communicatorService,
      user: new FlySquasherUserInfo(this.authService.userId)
    };
    this.sceneCommunicatorClientService.startCommunication();
  }

  ngOnDestroy(): void {
    this.sceneCommunicatorClientService.stopCommunication();
  }
}
