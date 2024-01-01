import { ResourceType } from "./resource-type";

export interface WinConditions {
  timeLimit?: number;
}

export interface MapTuning {
  unitCap: number;
}

export interface DifficultyModifiers {
  aiAdvantageResources?: Map<ResourceType, number>;
  reducedIncome?: number;
}

export interface ProbableWaffleGameModeLobby {
  winConditions: WinConditions;
  mapTuning: MapTuning;
  difficultyModifiers: DifficultyModifiers;
}
