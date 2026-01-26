import { ConstructionStateEnum } from "./construction-state-enum";
import type { ActorId } from "../../game-instance/player/player";

export interface ProbableWaffleSelectionData {
  button: "left" | "right";
  objectIds?: ActorId[];
  selectedArea?: { x: number; y: number; width: number; height: number };
  terrainSelectedTileVec3?: { x: number; y: number; z: number };
  terrainSelectedWorldVec3?: { x: number; y: number; z: number };
  shiftKey?: boolean;
  ctrlKey?: boolean;
}

export interface ProbableWaffleDoubleSelectionData {
  objectId: ActorId;
}

export type HealthComponentData = {
  health: number;
  armour: number;
};

export type ConstructionSiteComponentData = {
  state: ConstructionStateEnum;
  remainingConstructionTime: number;
  progressPercentage: number;
  assignedBuilders: ActorId[];
  assignedRepairers: ActorId[];
  playingBuildSound: boolean;
};
