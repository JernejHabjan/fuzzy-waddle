/** Native land owner branches; withdrawal proves threat removal by movement, not the separate combat-removal branch. */
export type ExpansionBranch = "expand" | "served" | "home_pressure" | "pressure_withdrawn" | "combat_resolved";

export const EXPANSION_HOME_RAIDER_ROLES = ["home-raider", "home-raider-1", "home-raider-2", "home-raider-3"] as const;
