import { ResourceTypeDefinition } from "./resource-type-definition";

export interface WinConditions {
  timeLimit?: number;
}

export interface MapTuning {
  unitCap?: number;
}

export interface DifficultyModifiers {
  aiAdvantageResources?: Map<ResourceTypeDefinition, number>;
  reducedIncome?: number;
}
