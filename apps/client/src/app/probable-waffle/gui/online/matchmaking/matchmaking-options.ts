import { FactionType } from "@fuzzy-waddle/api-interfaces";
import type { MatchmakingLevel } from "./matchmaking-level";

export type MatchmakingOptions = {
  factionType: FactionType | null;
  nrOfPlayers: number;
  levels: MatchmakingLevel[];
};
