import { ResourceType } from "./resource-type-definition";
import { ObjectNames } from "../game-instance/probable-waffle/object-names";

export interface TieConditions {
  maximumTimeLimitInMinutes?: number;
}

export interface WinConditions {
  noEnemyPlayersLeft?: boolean;
  timeReachedInMinutes?: number;
  kills?: number;
  resources?: Map<ResourceType, number>;
  actorsTotal?: number;
  actorsOfType?: Map<ObjectNames, number>; // e.g. "Soldier": 10 or "Barracks": 1
}

export interface LoseConditions {
  allActorsMustBeEliminated?: boolean;
  allBuildingsMustBeEliminated?: boolean;
}

export interface MapTuning {
  unitCap?: number;
}

export interface DifficultyModifiers {
  aiAdvantageResources?: Map<ResourceType, number>;
  reducedIncome?: number;
}
