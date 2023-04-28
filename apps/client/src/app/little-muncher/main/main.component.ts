import { Component, Input, OnInit } from '@angular/core';
import { littleMuncherGameConfig } from '../game/const/game-config';
import { LittleMuncherGameData } from '../game/little-muncher-game-data';
import { CommunicatorService } from '../game/communicator.service';
import { LittleMuncherGameSessionInstance } from '@fuzzy-waddle/api-interfaces';

@Component({
  selector: 'little-muncher-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  protected readonly littleMuncherGameConfig = littleMuncherGameConfig;
  @Input() gameSessionInstance!: LittleMuncherGameSessionInstance;
  protected gameData?: LittleMuncherGameData;

  constructor(private readonly communicator: CommunicatorService) {}

  ngOnInit(): void {
    this.gameData = {
      communicator: this.communicator,
      gameSessionInstance: this.gameSessionInstance
    };
  }
}
