import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { FactionDefinitions } from "../../../game/player/faction-definitions";
import {
  FactionType,
  ProbableWaffleGameFoundEvent,
  ProbableWaffleGameInstance,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";

export type MatchmakingLevel = {
  id: number;
  name: string;
  checked: boolean;
  imagePath: string;
  nrOfPlayers: number;
  enabled: boolean;
};
export type MatchmakingOptions = {
  factionType: FactionType | null;
  nrOfPlayers: number;
  levels: MatchmakingLevel[];
};
@Component({
  selector: "probable-waffle-matchmaking",
  templateUrl: "./matchmaking.component.html",
  styleUrls: ["./matchmaking.component.scss"]
})
export class MatchmakingComponent implements OnInit, OnDestroy {
  protected readonly FactionDefinitions = FactionDefinitions;
  protected searching = false;
  protected readonly matchmakingOptions: MatchmakingOptions;
  protected readonly roomsService = inject(RoomsService);
  protected readonly gameInstanceClientService = inject(GameInstanceClientService);
  private readonly router = inject(Router);
  private gameFoundSubscription?: Subscription;
  protected gameFound: boolean = false;
  protected navigatingText: string | undefined;

  constructor() {
    const firstNrOfPlayersOption = this.nrOfPlayersOptions[0];
    this.matchmakingOptions = {
      factionType: this.lastPlayedFactionType,
      nrOfPlayers: firstNrOfPlayersOption,
      levels: this.levels
    };
    this.nrOfPlayersChanged(firstNrOfPlayersOption);
  }

  async ngOnInit(): Promise<void> {
    await this.roomsService.init();
  }

  ngOnDestroy(): void {
    this.roomsService.destroy();
    this.cancelSearching();
  }

  private get lastPlayedFactionType(): FactionType | null {
    // load it from local storage
    const factionType = localStorage.getItem("last-played-faction-type");
    if (factionType) {
      // try parse in FactionType enum
      // convert to int
      const factionTypeInt = parseInt(factionType, 10);
      const factionTypeEnum = FactionType[factionTypeInt];
      if (factionTypeEnum) {
        return factionTypeInt;
      }
    }
    return null;
  }

  protected factionChanged() {
    localStorage.setItem("last-played-faction-type", this.matchmakingOptions.factionType?.toString() ?? "");
  }

  private get levels(): MatchmakingLevel[] {
    return Object.values(ProbableWaffleLevels).map((level) => ({
      id: level.id,
      name: level.name,
      checked: true,
      imagePath: level.presentation.imagePath,
      enabled: true,
      nrOfPlayers: level.mapInfo.startPositionsOnTile.length
    }));
  }

  protected get nrOfPlayersOptions(): number[] {
    const options = new Set<number>();
    Object.values(ProbableWaffleLevels).forEach((level) => {
      options.add(level.mapInfo.startPositionsOnTile.length);
    });
    return Array.from(options);
  }

  protected async startSearching() {
    this.searching = true;
    this.gameFoundSubscription = this.gameInstanceClientService.listenToGameFound().subscribe(this.onGameFound);
    await this.gameInstanceClientService.requestGameSearchForMatchmaking(this.matchmakingOptions);
  }

  protected get selectedLevels(): MatchmakingLevel[] {
    return this.matchmakingOptions.levels.filter((level) => level.checked);
  }

  private onGameFound = async ($event: ProbableWaffleGameFoundEvent) => {
    this.gameFound = true;

    await this.gameInstanceClientService.joinGameInstanceAsPlayerForMatchmaking($event.gameInstanceId);

    this.navigatingText = "Joining game in 3 seconds...";
    setTimeout(() => (this.navigatingText = "Joining game in 2 seconds..."), 1000);
    setTimeout(() => (this.navigatingText = "Joining game in 1 second..."), 2000);
    setTimeout(async () => await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame(), 3000);
  };

  protected async cancelSearching() {
    if (!this.searching) return;
    this.searching = false;
    this.gameFoundSubscription?.unsubscribe();
    await this.gameInstanceClientService.stopRequestGameSearchForMatchmaking();
  }

  protected nrOfPlayersChanged(nr: number) {
    this.matchmakingOptions.nrOfPlayers = nr;
    const nrOfPlayers = this.matchmakingOptions.nrOfPlayers;
    this.matchmakingOptions.levels.forEach((level) => {
      level.enabled = level.nrOfPlayers === nrOfPlayers;
      level.checked = level.enabled;
    });
  }

  checkedChanged(level: MatchmakingLevel) {
    this.matchmakingOptions.levels.find((l) => l.id === level.id)!.checked = !level.checked;
  }
}
