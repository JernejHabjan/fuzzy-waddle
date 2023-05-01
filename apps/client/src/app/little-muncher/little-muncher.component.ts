import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { GameSessionState, LittleMuncherGameCreate } from '@fuzzy-waddle/api-interfaces';
import { GameInstanceClientService } from './main/game-instance-client.service';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  templateUrl: './little-muncher.component.html',
  styleUrls: ['./little-muncher.component.scss']
})
export class LittleMuncherComponent implements OnInit, OnDestroy {
  protected readonly faSpinner = faSpinner;
  protected loading = false;

  constructor(protected readonly gameInstanceClientService: GameInstanceClientService) {}

  @HostListener('window:beforeunload')
  async onBeforeUnload() {
    await this.gameInstanceClientService.stopGame();
  }

  async startLevel(gameCreate: LittleMuncherGameCreate): Promise<void> {
    this.loading = true;
    try {
      await this.gameInstanceClientService.startLevel(gameCreate);
    } finally {
      this.loading = false;
    }
  }

  async ngOnDestroy(): Promise<void> {
    await this.gameInstanceClientService.stopGame();
  }

  async ngOnInit(): Promise<void> {
    await this.gameInstanceClientService.startGame();
  }

  get startingOrStopping() {
    const currentState = this.gameInstanceClientService.gameInstance!.gameInstanceMetadata!.data.sessionState!;
    return currentState === GameSessionState.WaitingForPlayers || currentState === GameSessionState.EndingLevel;
  }
}
