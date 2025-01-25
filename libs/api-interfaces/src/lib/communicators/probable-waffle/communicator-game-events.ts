export interface ProbableWaffleSelectionData {
  button: "left" | "right";
  objectIds?: string[];
  selectedArea?: { x: number; y: number; width: number; height: number };
  terrainSelectedTileVec3?: { x: number; y: number; z: number };
  terrainSelectedWorldVec3?: { x: number; y: number; z: number };
  shiftKey?: boolean;
  ctrlKey?: boolean;
}

export type HealthComponentData = {
  health: number;
  armour: number;
};
