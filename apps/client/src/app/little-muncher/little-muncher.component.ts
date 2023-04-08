import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { LittleMuncherHills } from '@fuzzy-waddle/api-interfaces';
import { GameInstanceClientService } from './main/game-instance-client.service';
import { ReferenceHolder } from './game/reference-holder';

@Component({
  selector: 'fuzzy-waddle-little-muncher',
  templateUrl: './little-muncher.component.html',
  styleUrls: ['./little-muncher.component.scss']
})
export class LittleMuncherComponent implements OnInit, OnDestroy {
  protected readonly ReferenceHolder = ReferenceHolder;

  constructor(private gameInstanceClientService: GameInstanceClientService) {}

  @HostListener('window:beforeunload')
  async onBeforeUnload() {
    await this.gameInstanceClientService.destroyGameInstance();
  }

  async runGame(hillName: LittleMuncherHills): Promise<void> {
    await this.gameInstanceClientService.setupGameMode(hillName);
  }

  async ngOnDestroy(): Promise<void> {
    await this.gameInstanceClientService.destroyGameInstance();
  }

  async ngOnInit(): Promise<void> {
    await this.gameInstanceClientService.createGameInstance();
  }
}
