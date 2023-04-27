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
  protected readonly gameSessionInstance: LittleMuncherGameSessionInstance = new LittleMuncherGameSessionInstance();
  protected loading = false;

  constructor(private gameInstanceClientService: GameInstanceClientService) {}

  @HostListener('window:beforeunload')
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGame(this.gameSessionInstance);
  }

  async runGame(gameCreate: LittleMuncherGameCreate): Promise<void> {
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
    await this.gameInstanceClientService.startGame(this.gameSessionInstance);
  }
}
