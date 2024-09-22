import { State } from "mistreevous";

export interface IPlayerPawnControllerAgent {
  // Player Orders and Status
  PlayerOrderExists(): boolean;
  PlayerOrderIs(orderType: string): boolean;

  // Combat-related Actions
  HasAttackComponent(): boolean;
  TargetIsAlive(): boolean;
  HealthAboveThreshold(threshold: number): boolean;
  InRange(): boolean;
  Attack(): State;
  AttackEnemy(): State;
  AssignTarget(targetType: string): State;
  PatrolOrIdle(): State;
  NoEnemiesVisible(): boolean;
  AnyEnemyVisible(): boolean;
  CooldownReady(): boolean;
  Attacked(): boolean;

  // Resource Gathering
  CanGatherResource(): boolean;
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

  // Resource Drop-off
  InRangeOfResourceDropOff(): boolean;

  // Construction and Building
  ConstructBuilding(): State;
  LeaveConstructionSiteOrCurrentContainer(): State;

  // Movement
  MoveToTarget(): State;
  CanMoveToTarget(): Promise<boolean>;
  Stop(): State;
  MoveRandomlyInRange(range: number): State;
  TargetExists(): boolean;
}
