/** Scenario-specific obligations read from native decisions and shared queue outcomes, never injected planner state. */
export interface RuntimeTechnologyContract {
  readonly latestTick: number;
  readonly branch: "small_army" | "mass_army" | "emergency" | "air_clue" | "air_mass" | "stale_counter" | "matchup";
  readonly productObjectName: string;
  readonly researchType?: string;
  readonly minimumBeneficiaries?: number;
  readonly counterCount?: number;
  readonly withdrawnTick?: number;
  readonly unavailableProductObjectName?: string;
  readonly requiredRangedAlternative?: boolean;
}
