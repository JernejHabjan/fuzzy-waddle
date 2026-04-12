import { inject, Injectable } from "@angular/core";
import { Subscription } from "rxjs";
import { GameInstanceClientService } from "../../../communicators/game-instance-client.service";
import { RoomsService } from "../../../communicators/rooms/rooms.service";
import {
  FactionType,
  MatchmakingTeamConfiguration,
  type ProbableWaffleGameFoundEvent,
  ProbableWaffleLevels
} from "@fuzzy-waddle/api-interfaces";
import { type IMatchmakingService } from "./matchmaking.service.interface";
import { environment } from "../../../../../environments/environment";
import type { MatchmakingLevel } from "./matchmaking-level";
import type { MatchmakingOptions } from "./matchmaking-options";

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
  private countdownTimers: number[] = [];

  constructor() {
    const firstNrOfPlayersOption = this.nrOfPlayersOptions[0];
    if (!firstNrOfPlayersOption) {
      throw new Error("No levels available for matchmaking");
    }
    this.matchmakingOptions = {
      factionType: this.lastPlayedFactionType,
      nrOfPlayers: firstNrOfPlayersOption,
      teamConfiguration: MatchmakingTeamConfiguration.FreeForAll,
      levels: this.levels
    };
    this.nrOfPlayersChanged(firstNrOfPlayersOption);
  }

  async init(): Promise<void> {
    this.clearCountdownTimers();
    this.gameFound = false;
    this.navigatingText = undefined;
    this.searching = false;
    await this.roomsService.init();
  }

  async destroy(): Promise<void> {
    this.clearCountdownTimers();
    this.roomsService.destroy();
    if (this.gameFound) {
      this.gameFoundSubscription?.unsubscribe();
      return;
    }
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
    return Object.values(ProbableWaffleLevels)
      .filter((level) => (environment.production ? !level.devOnly : true))
      .map((level) => ({
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
    const gameFoundListener = await this.gameInstanceClientService.getGameFoundListener();
    this.gameFoundSubscription = gameFoundListener.subscribe(this.onGameFound);
    await this.gameInstanceClientService.requestGameSearchForMatchmaking(this.matchmakingOptions);
  }

  get selectedLevels(): MatchmakingLevel[] {
    return this.matchmakingOptions.levels.filter((level) => level.checked);
  }

  private onGameFound = async ($event: ProbableWaffleGameFoundEvent) => {
    this.gameFound = true;
    this.searching = false;
    this.gameFoundSubscription?.unsubscribe();

    await this.gameInstanceClientService.joinGameInstanceAsPlayerForMatchmaking($event.gameInstanceId);

    this.navigatingText = "Joining game in 3 seconds...";
    this.countdownTimers.push(window.setTimeout(() => (this.navigatingText = "Joining game in 2 seconds..."), 1000));
    this.countdownTimers.push(window.setTimeout(() => (this.navigatingText = "Joining game in 1 second..."), 2000));
    this.countdownTimers.push(
      window.setTimeout(async () => await this.gameInstanceClientService.navigateToLobbyOrDirectlyToGame(), 3000)
    );
  };

  async cancelSearching() {
    if (!this.searching) return;
    this.searching = false;
    this.gameFoundSubscription?.unsubscribe();
    await this.gameInstanceClientService.stopRequestGameSearchForMatchmaking();
  }

  private clearCountdownTimers(): void {
    this.countdownTimers.forEach((timer) => clearTimeout(timer));
    this.countdownTimers = [];
  }

  nrOfPlayersChanged(nr: number) {
    this.matchmakingOptions.nrOfPlayers = nr;
    // Reset to FFA if invalid team configuration for this player count
    if (!this.isTeamConfigurationValidForPlayerCount(this.matchmakingOptions.teamConfiguration, nr)) {
      this.matchmakingOptions.teamConfiguration = MatchmakingTeamConfiguration.FreeForAll;
    }
    this.updateMapAvailability();
  }

  teamConfigurationChanged(teamConfig: MatchmakingTeamConfiguration) {
    this.matchmakingOptions.teamConfiguration = teamConfig;
    this.updateMapAvailability();
  }

  /**
   * Update map availability based on current player count and team configuration
   */
  private updateMapAvailability() {
    const nrOfPlayers = this.matchmakingOptions.nrOfPlayers;
    this.matchmakingOptions.levels.forEach((level) => {
      level.enabled = level.nrOfPlayers === nrOfPlayers;
      level.checked = level.enabled;
    });
  }

  /**
   * Get available team configurations for the current player count
   */
  get availableTeamConfigurations(): MatchmakingTeamConfiguration[] {
    const nrOfPlayers = this.matchmakingOptions.nrOfPlayers;
    const configs: MatchmakingTeamConfiguration[] = [MatchmakingTeamConfiguration.FreeForAll];

    // Only add team modes for valid player counts
    if (nrOfPlayers === 4) {
      configs.push(MatchmakingTeamConfiguration.TwoVsTwo);
    } else if (nrOfPlayers === 6) {
      configs.push(MatchmakingTeamConfiguration.ThreeVsThree);
    } else if (nrOfPlayers === 8) {
      configs.push(MatchmakingTeamConfiguration.FourVsFour);
    }

    return configs;
  }

  /**
   * Check if a team configuration is valid for a given player count
   */
  private isTeamConfigurationValidForPlayerCount(
    teamConfig: MatchmakingTeamConfiguration,
    playerCount: number
  ): boolean {
    switch (teamConfig) {
      case MatchmakingTeamConfiguration.FreeForAll:
        return true; // Always valid
      case MatchmakingTeamConfiguration.TwoVsTwo:
        return playerCount === 4;
      case MatchmakingTeamConfiguration.ThreeVsThree:
        return playerCount === 6;
      case MatchmakingTeamConfiguration.FourVsFour:
        return playerCount === 8;
      default:
        return false;
    }
  }

  /**
   * Get display name for team configuration
   */
  getTeamConfigurationName(config: MatchmakingTeamConfiguration): string {
    switch (config) {
      case MatchmakingTeamConfiguration.FreeForAll:
        return "Free For All";
      case MatchmakingTeamConfiguration.TwoVsTwo:
        return "2v2";
      case MatchmakingTeamConfiguration.ThreeVsThree:
        return "3v3";
      case MatchmakingTeamConfiguration.FourVsFour:
        return "4v4";
      default:
        return config;
    }
  }

  checkedChanged(level: MatchmakingLevel) {
    this.matchmakingOptions.levels.find((l) => l.id === level.id)!.checked = !level.checked;
  }
}
