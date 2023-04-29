import { Component, OnInit } from '@angular/core';
import { littleMuncherGameConfig } from '../game/const/game-config';
import { LittleMuncherGameData } from '../game/little-muncher-game-data';
import { CommunicatorService } from '../game/communicator.service';
import { GameInstanceClientService } from './game-instance-client.service';

@Component({
  selector: 'little-muncher-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  protected readonly littleMuncherGameConfig = littleMuncherGameConfig;
  protected gameData?: LittleMuncherGameData;

  constructor(
    private readonly communicator: CommunicatorService,
    protected readonly gameInstanceClientService: GameInstanceClientService
  ) {}

  ngOnInit(): void {
    this.gameData = {
      communicator: this.communicator,
      gameInstance: this.gameInstanceClientService.gameInstance!
    };
  }
}
