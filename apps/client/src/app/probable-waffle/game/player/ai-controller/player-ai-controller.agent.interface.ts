import { State } from "mistreevous";

export interface IPlayerControllerAgent {
  // Combat-related actions
  IsBaseUnderAttack(): boolean;
  IsBaseUnderHeavyAttack(): boolean;
  AssignDefendersToEnemies(): State;
  AttackEnemyBase(): State;
  IsInCombat(): boolean;
  LowHealthUnit(): boolean;
  RetreatUnit(): State;
  FocusFire(): State;
  FlankEnemy(): State;
  EnemySpotted(): boolean;
  EnemyInRange(): boolean;
  EnemyFlankOpen(): boolean;

  // Resource management
  HasEnoughMilitaryPower(): boolean;
  HasSurplusResources(): boolean;
  NeedMoreResources(): boolean;
  HasSufficientResources(): boolean;
  ResourceShortage(): boolean;
  HasIdleTrainingBuilding(): boolean;
  HasEnoughResourcesForWorker(): boolean;

  // Worker and resource gathering
  AssignWorkersToGather(): State;
  TrainWorker(): State;
  GatherResources(): State;
  AssignWorkerToBuild(): State;
  AssignWorkersToResource(): State;
  ReassignWorkersToResource(): State;
  ContinueNormalGathering(): State;
  NeedMoreWorkers(): boolean;

  // Building and construction
  IsBaseExpansionNeeded(): boolean;
  ChooseStructureToBuild(): State;
  StartBuildingStructure(): State;
  NeedMoreHousing(): boolean;
  NeedMoreProduction(): boolean;
  NeedMoreDefense(): boolean;
  AssignHousingBuilding(): State;
  AssignProductionBuilding(): State;
  AssignDefenseBuilding(): State;

  // Upgrades and improvements
  StartUpgrade(): State;
  SufficientResourcesForUpgrade(): boolean;

  // Scouting and intelligence
  NeedToScout(): boolean;
  AssignScoutUnits(): State;
  AnalyzeEnemyBase(): Promise<State>;
  GatherEnemyData(): State;
  ContinueScouting(): State;
  AnalyzeGameMap(): Promise<State>;
  ShouldReanalyzeMap(): boolean;
  ReplanBase(): State;
  ShouldReplanBase(): boolean;
  HasPlannedBuildingNeed(): boolean;
  EnsureReservationForNextNeed(): Promise<State>;
  AttemptPlacePlannedBuilding(): State;
  HasResourcesForReservedBuilding(): boolean;
  // Strategic shifts
  ShiftToAggressiveStrategy(): State;
  ShiftToDefensiveStrategy(): State;
  ShiftToEconomicStrategy(): State;
  DecideNextMoveBasedOnAnalysis(): State;
  IsEnemyPlayerWeak(): boolean;

  // Force maintenance & production
  ShouldProduceMilitaryUnit(): boolean;
  HasResourcesForQueuedUnit(): boolean;
  QueueMilitaryUnitProduction(): State;
  HasDamagedStructures(): boolean;
  AssignRepairWorkers(): State;
}
