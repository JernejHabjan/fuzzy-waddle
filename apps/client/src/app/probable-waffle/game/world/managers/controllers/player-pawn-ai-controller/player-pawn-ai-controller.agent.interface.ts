import { State } from "mistreevous";

export interface IPlayerPawnControllerAgent {
  // Player Orders and Status
  OrderExistsInQueue(): boolean;
  AssignNextOrderFromQueue(): State;
  PlayerOrderIs(orderType: string): boolean;

  // Combat-related Actions
  HasAttackComponent(): boolean;
  TargetIsAlive(): boolean;
  HealthAboveThresholdPercentage(threshold: number): boolean;
  InRange(type: "gather" | "attack" | "dropOff" | "construct"): boolean;
  Attack(): State;
  AssignEnemy(source: string): State;
  NoEnemiesVisible(): boolean;
  AnyEnemyVisible(): boolean;
  CooldownReady(type: string): boolean;
  Attacked(): boolean;
  Heal(): State;

  // Resource Gathering
  AcquireNewResourceSource(): State;
  GatherResource(): Promise<State>;
  DropOffResources(): Promise<State>;
  ContinueGathering(): State;
  TargetHasResources(): boolean;
  AnyHighValueResourceVisible(): boolean;
  GatherHighValueResource(): State;
  HasHarvestComponent(): boolean;
  GatherCapacityFull(): boolean;
  AssignResourceDropOff(): State;

  // Construction and Building
  ConstructBuilding(): State;
  LeaveConstructionSiteOrCurrentContainer(): State;

  // Movement
  MoveToTarget(type: "move" | "gather" | "attack" | "dropOff" | "construct"): Promise<State>;
  MoveToTargetOrLocation(type: "move" | "gather" | "attack" | "dropOff" | "construct"): Promise<State>;
  MoveToLocation(): Promise<State>;
  Stop(): State;
  AssignMoveRandomlyInRange(range: number): Promise<State>;
  TargetExists(): boolean;

  // Utility
  Succeed(): State;
  Fail(): State;
}
