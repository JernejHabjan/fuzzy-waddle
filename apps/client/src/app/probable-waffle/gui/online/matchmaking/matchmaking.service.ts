import { inject, Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import { FactionType, ProbableWaffleGameFoundEvent, ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";
import { MatchmakingLevel, MatchmakingOptions } from "./matchmaking.component";
import { IMatchmakingService } from "./matchmaking.service.interface";

@Injectable({
  providedIn: "root"
})
export class MatchmakingService implements IMatchmakingService {
  searching = false;
  readonly matchmakingOptions: MatchmakingOptions;
  private readonly roomsService = inject(RoomsService);
  readonly gameInstanceClientService = inject(GameInstanceClientService);
  private gameFoundSubscription?: Subscription;
  gameFound: boolean = false;
  navigatingText: string | undefined;

  constructor() {
    const firstNrOfPlayersOption = this.nrOfPlayersOptions[0];
    this.matchmakingOptions = {
      factionType: this.lastPlayedFactionType,
      nrOfPlayers: firstNrOfPlayersOption,
      levels: this.levels
    };
    this.nrOfPlayersChanged(firstNrOfPlayersOption);
  }

  async init(): Promise<void> {
    this.gameFound = false;
    this.navigatingText = undefined;
    this.searching = false;
    await this.roomsService.init();
  }

  async destroy(): Promise<void> {
    this.roomsService.destroy();
    await this.cancelSearching();
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

  factionChanged() {
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

  get nrOfPlayersOptions(): number[] {
    const options = new Set<number>();
    Object.values(ProbableWaffleLevels).forEach((level) => {
      options.add(level.mapInfo.startPositionsOnTile.length);
    });
    return Array.from(options);
  }

  async startSearching() {
    this.searching = true;
    this.gameFoundSubscription = this.gameInstanceClientService.listenToGameFound().subscribe(this.onGameFound);
    await this.gameInstanceClientService.requestGameSearchForMatchmaking(this.matchmakingOptions);
  }

  get selectedLevels(): MatchmakingLevel[] {
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

  async cancelSearching() {
    if (!this.searching) return;
    this.searching = false;
    this.gameFoundSubscription?.unsubscribe();
    await this.gameInstanceClientService.stopRequestGameSearchForMatchmaking();
  }

  nrOfPlayersChanged(nr: number) {
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
