export interface ProbableWaffleSelectionData {
  button: "left" | "right";
  selected?: string[];
  selectedArea?: { x: number; y: number; width: number; height: number };
  terrainSelected?: { x: number; y: number; z: number };
  shiftKey?: boolean;
  ctrlKey?: boolean;
}

export type HealthComponentData = {
  health: number;
  armour: number;
};
