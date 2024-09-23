import { State } from "mistreevous";

export interface IPlayerPawnControllerAgent {
  // Player Orders and Status
  PlayerOrderExists(): boolean;
  PlayerOrderIs(orderType: string): boolean;

  // Combat-related Actions
  HasAttackComponent(): boolean;
  TargetIsAlive(): boolean;
  HealthAboveThresholdPercentage(threshold: number): boolean;
  InRange(): boolean;
  Attack(): State;
  AssignEnemy(source: string): State;
  NoEnemiesVisible(): boolean;
  AnyEnemyVisible(): boolean;
  CooldownReady(type: string): boolean;
  Attacked(): boolean;

  // Resource Gathering
  AcquireNewResourceSource(): State;
  GatherResource(): State;
  TargetDepleted(): boolean;
  ReturnResources(): State;
  DropOffResources(): State;
  ContinueGathering(): State;
  TargetHasResources(): boolean;
  AnyHighValueResourceVisible(): boolean;
  GatherHighValueResource(): State;
  HasHarvestComponent(): boolean;
  CurrentlyGatheringResources(): boolean;

  // Resource Drop-off
  InRangeOfResourceDropOff(): boolean;

  // Construction and Building
  ConstructBuilding(): State;
  LeaveConstructionSiteOrCurrentContainer(): State;

  // Movement
  MoveToTarget(): Promise<State>;
  // CanMoveToTarget(): Promise<boolean>;
  Stop(): State;
  MoveRandomlyInRange(range: number): Promise<State>;
  TargetExists(): boolean;
}
