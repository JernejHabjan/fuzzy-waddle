import { FactionType, MatchmakingTeamConfiguration } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MatchmakingLevel } from "./matchmaking-level";

export type MatchmakingOptions = {
  factionType: FactionType | null;
  nrOfPlayers: number;
  teamConfiguration: MatchmakingTeamConfiguration;
  levels: MatchmakingLevel[];
};
