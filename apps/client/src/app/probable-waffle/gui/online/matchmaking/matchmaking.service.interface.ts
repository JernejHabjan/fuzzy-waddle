import { Subscription } from "rxjs";
import { FactionType, ProbableWaffleGameFoundEvent, ProbableWaffleLevels } from "@fuzzy-waddle/api-interfaces";
import { MatchmakingLevel, MatchmakingOptions } from "./matchmaking.component";

export interface IMatchmakingService {
  searching: boolean;
  matchmakingOptions: MatchmakingOptions;
  gameFound: boolean;
  navigatingText: string | undefined;

  init(): Promise<void>;
  destroy(): Promise<void>;

  startSearching(): Promise<void>;
  cancelSearching(): Promise<void>;

  factionChanged(): void;
  nrOfPlayersChanged(nr: number): void;
  checkedChanged(level: MatchmakingLevel): void;
}
