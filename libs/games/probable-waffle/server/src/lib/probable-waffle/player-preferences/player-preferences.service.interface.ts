import type { ProbableWafflePlayerPreferences } from "@fuzzy-waddle/probable-waffle-protocol";

/** Persistence boundary for authenticated Probable Waffle preferences. */
export interface PlayerPreferencesServiceInterface {
  get(userId: string): Promise<ProbableWafflePlayerPreferences | null>;
  save(userId: string, preferences: ProbableWafflePlayerPreferences): Promise<ProbableWafflePlayerPreferences>;
}
