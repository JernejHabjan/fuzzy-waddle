// Basic graph node & graph state types for automatic tech tree inference.
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../prefabs/definitions/prefab-definition";

export type TechNodeKind = "Unit" | "Building" | "Upgrade";

export interface TechTreeNode {
  id: ObjectNames; // Upgrades may be synthetic strings
  kind: TechNodeKind;
  faction: FactionType;
  prerequisites: Array<ObjectNames>; // ids this node depends on
  produces: ObjectNames[]; // unit production edges
  constructs: ObjectNames[]; // building construction edges
  definition: PrefabDefinition; // Full actor definition for validation and reference
}

export interface TechTreeGraph {
  faction: FactionType;
  nodes: Record<string, TechTreeNode>;
}

export interface TechUnlockState {
  unlocked: Set<string>;
}
