import { Component, Input, NgZone } from '@angular/core';
import { littleMuncherGameConfig } from '../game/const/game-config';
import { LittleMuncherGameData } from '../game/little-muncher-game-data';
import { CommunicatorService } from '../game/communicator.service';
import { LittleMuncherGameSessionInstance } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'little-muncher-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {
  protected readonly littleMuncherGameConfig = littleMuncherGameConfig;
  @Input() gameSessionInstance!: LittleMuncherGameSessionInstance;
  protected readonly gameData: LittleMuncherGameData;

  constructor(private readonly ngZone: NgZone, private readonly communicator: CommunicatorService) {
    this.gameData = {
      communicator: this.communicator
    };
  }
}
