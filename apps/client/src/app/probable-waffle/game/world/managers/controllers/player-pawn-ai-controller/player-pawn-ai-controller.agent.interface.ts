import { State } from "mistreevous";

export type PlayerPawnRangeType = "move" | "gather" | "attack" | "dropOff" | "construct" | "heal";
export type PlayerPawnCooldownType = "gather" | "attack" | "construct" | "heal";

export interface IPlayerPawnControllerAgent {
  // Player Orders and Status
  OrderExistsInQueue(): boolean;
  AssignNextOrderFromQueue(): State;
  PlayerOrderIs(orderType: string): boolean;

  // Combat-related Actions
  HasAttackComponent(): boolean;
  TargetIsAlive(): boolean;
  /* InRange is not condition but promisey action until this is addressed - https://github.com/nikkorn/mistreevous/issues/95 */
  InRange(type: PlayerPawnRangeType): Promise<State>;
  Attack(): State;
  AssignEnemy(source: string): State;
  NoEnemiesVisible(): boolean;
  AnyEnemyVisible(): boolean;
  CooldownReady(type: PlayerPawnCooldownType): boolean;
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

  // Construction and Building
  ConstructBuilding(): State;
  LeaveConstructionSiteOrCurrentContainer(): State;

  // Movement
  MoveToTarget(type: PlayerPawnRangeType): Promise<State>;
  MoveToTargetOrLocation(type: PlayerPawnRangeType): Promise<State>;
  MoveToLocation(): Promise<State>;
  Stop(): State;
  AssignMoveRandomlyInRange(range: number): Promise<State>;
  TargetExists(): boolean;
  TargetOrLocationExists(): boolean;

  // Utility
  Succeed(): State;
  Fail(): State;
  Log(message: string): State;
}
