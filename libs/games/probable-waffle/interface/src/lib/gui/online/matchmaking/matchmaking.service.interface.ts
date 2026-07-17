import type { MatchmakingLevel } from "./matchmaking-level";
import type { MatchmakingOptions } from "./matchmaking-options";

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
