import { ResourceTypeDefinition } from "./resource-type-definition";

export interface Conditions {
  maximumTimeLimitInMinutes?: number;
}

export interface MapTuning {
  unitCap?: number;
}

export interface DifficultyModifiers {
  aiAdvantageResources?: Map<ResourceTypeDefinition, number>;
  reducedIncome?: number;
}
