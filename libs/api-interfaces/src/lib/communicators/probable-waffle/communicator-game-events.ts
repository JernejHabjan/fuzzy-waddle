import { ConstructionStateEnum } from "./construction-state-enum";

export interface ProbableWaffleSelectionData {
  button: "left" | "right";
  objectIds?: string[];
  selectedArea?: { x: number; y: number; width: number; height: number };
  terrainSelectedTileVec3?: { x: number; y: number; z: number };
  terrainSelectedWorldVec3?: { x: number; y: number; z: number };
  shiftKey?: boolean;
  ctrlKey?: boolean;
}

export interface ProbableWaffleDoubleSelectionData {
  objectId: string;
}

export type HealthComponentData = {
  health: number;
  armour: number;
};

export type ConstructionSiteComponentData = {
  state: ConstructionStateEnum;
};
