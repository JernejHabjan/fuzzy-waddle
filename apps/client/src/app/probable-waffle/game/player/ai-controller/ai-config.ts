// Central AI configuration defaults
// Existing systems reading hardcoded values may be refactored to reference AI_CONFIG over time.
export const AI_CONFIG = {
  strategyShiftIntervalMs: 4000, // Minimum interval between strategy mode changes
  mapAnalysisIntervalMs: 2000, // Minimum interval between full map analyses (aligned w/ previous TTL)
  attackTriggerIntervalMs: 5000, // Minimum interval between initiating large-scale attack waves
  strategyLockMs: 6000, // Lock duration after a successful strategy shift to prevent oscillation
  // Controller timing & telemetry
  controllerStepIntervalMs: 1000,
  telemetryFrameModulo: 10,
  // Aggression hysteresis ratios
  hysteresisAggressiveEnter: 1.15,
  hysteresisAggressiveExit: 1.05,
  // Owned actor refresh & visibility heuristics
  ownedRefreshIntervalMs: 1000,
  enemyVisionRadiusTiles: 18,
  enemyNearBaseRadiusTiles: 10,
  defenderAssignmentRadiusTiles: 12,
  defenderFallbackMaxCount: 4,
  // Default thresholds (fallbacks when adaptive system not available)
  baseHeavyAttackDefaultThreshold: 10,
  militaryPowerDefaultThreshold: 3,
  resourceSurplusDefaultThreshold: 500,
  needMoreResourcesThreshold: 5000,
  hasSufficientResourcesThreshold: 500,
  resourceShortageThreshold: 300,
  gatherSearchRadius: 100,
  hasEnoughResourcesForWorkerThreshold: 100,
  sufficientResourcesForUpgradeThreshold: 1000,
  needMoreWorkersThreshold: 5,
  housingBuffer: 3,
  // Production / supply planning
  defaultWorkMillWoodCost: 120,
  // Building placement search parameters
  buildingPlacementSearchStartRadius: 2,
  buildingPlacementSearchIncrement: 2,
  buildingPlacementSearchMaxRadius: 12,
  buildingPlacementSearchStep: 2,
  buildingPlacementRandomOffsetRange: 10,
  // Base planning stale timing
  baseReplanStaleMs: 4000,
  fallbackVisibleEnemyLimit: 3
};
