import { ResourceType } from "./resource-type-definition";

export type PlayerStateActionType =
  | "unit_produced"
  | "unit_killed"
  | "building_constructed"
  | "building_destroyed"
  | "resource_collected"
  | "resource_spent";

export interface PlayerStateAction<T = any> {
  type: PlayerStateActionType;
  time: number;
  playerNr: number;
  data: T;
}

export interface PlayerStateActionUnitProducedData {
  unitName: string;
}
export interface PlayerStateActionUnitProduced extends PlayerStateAction<PlayerStateActionUnitProducedData> {}

export interface PlayerStateActionUnitKilledData {
  unitName: string;
}
export interface PlayerStateActionUnitKilled extends PlayerStateAction<PlayerStateActionUnitKilledData> {}

export interface PlayerStateActionBuildingConstructedData {
  buildingName: string;
}
export interface PlayerStateActionBuildingConstructed
  extends PlayerStateAction<PlayerStateActionBuildingConstructedData> {}

export interface PlayerStateActionBuildingDestroyedData {
  buildingName: string;
}
export interface PlayerStateActionBuildingDestroyed extends PlayerStateAction<PlayerStateActionBuildingDestroyedData> {}

export interface PlayerStateActionResourceCollectedData {
  resourceType: ResourceType;
  amount: number;
}
export interface PlayerStateActionResourceCollected extends PlayerStateAction<PlayerStateActionResourceCollectedData> {}

export interface PlayerStateActionResourceSpentData {
  resourceType: ResourceType;
  amount: number;
}
export interface PlayerStateActionResourceSpent extends PlayerStateAction<PlayerStateActionResourceSpentData> {}
