import { Component, Input, OnInit } from '@angular/core';
import { flySquasherGameConfig } from '../game/consts/game-config';
import { LittleMuncherGameInstance, LittleMuncherUserInfo } from '@fuzzy-waddle/api-interfaces';
import { AuthService } from '../../auth/auth.service';
import { CommunicatorService } from '../../little-muncher/game/communicator.service';
import { LittleMuncherGameData } from '../../little-muncher/game/little-muncher-game-data';

@Component({
  selector: 'fly-squasher-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  protected readonly flySquasherGameConfig = flySquasherGameConfig;
  protected gameData!: LittleMuncherGameData; // todo
  @Input() level!: number;

  constructor(private readonly authService: AuthService, private readonly communicatorService: CommunicatorService) {}

  ngOnInit(): void {
    console.log('this level is ', this.level);
    const gameSessionInstance = new LittleMuncherGameInstance({
      gameModeData: {
        // todo level: this.level
      }
    }); // todo later use ProbableWaffleGameInstance
    this.gameData = {
      gameInstance: gameSessionInstance,
      communicator: this.communicatorService,
      user: new LittleMuncherUserInfo(this.authService.userId) // todo later use ProbableWaffleUserInfo
    };
  }
}
