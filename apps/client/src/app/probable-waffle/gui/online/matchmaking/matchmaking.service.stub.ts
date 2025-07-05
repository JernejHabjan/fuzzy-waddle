import { FactionType } from "@fuzzy-waddle/api-interfaces";
import { MatchmakingLevel } from "./matchmaking.component";
import { IMatchmakingService } from "./matchmaking.service.interface";

export const matchmakingServiceStub = {
  searching: false,
  matchmakingOptions: {
    factionType: FactionType.Skaduwee,
    nrOfPlayers: 0,
    levels: []
  },
  gameFound: false,
  cancelSearching(): Promise<void> {
    return Promise.resolve();
  },
  checkedChanged(level: MatchmakingLevel) {
    //
  },
  nrOfPlayersChanged(nr: number) {},
  startSearching(): Promise<void> {
    return Promise.resolve();
  },
  navigatingText: "",
  init(): Promise<void> {
    return Promise.resolve();
  },
  destroy(): Promise<void> {
    return Promise.resolve();
  },
  factionChanged() {
    //
  }
} satisfies IMatchmakingService;
