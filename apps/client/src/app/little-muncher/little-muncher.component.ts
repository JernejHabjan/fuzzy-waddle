import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { LittleMuncherGameCreate, LittleMuncherGameSessionInstance } from '@fuzzy-waddle/api-interfaces';
import { GameInstanceClientService } from './main/game-instance-client.service';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  templateUrl: './little-muncher.component.html',
  styleUrls: ['./little-muncher.component.scss']
})
export class LittleMuncherComponent implements OnInit, OnDestroy {
  protected readonly faSpinner = faSpinner;
  protected loading = false;
  protected gameSessionInstance?: LittleMuncherGameSessionInstance;

  constructor(private gameInstanceClientService: GameInstanceClientService) {}

  @HostListener('window:beforeunload')
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGame(this.gameSessionInstance);
  }

  async startLevel(gameCreate: LittleMuncherGameCreate): Promise<void> {
    this.loading = true;
    try {
      await this.gameInstanceClientService.startLevel(this.gameSessionInstance, gameCreate);
    } finally {
      this.loading = false;
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.gameInstanceClientService.stopGame(this.gameSessionInstance);
  }

  async ngOnInit(): Promise<void> {
    this.gameSessionInstance = await this.gameInstanceClientService.startGame();
  }
}
