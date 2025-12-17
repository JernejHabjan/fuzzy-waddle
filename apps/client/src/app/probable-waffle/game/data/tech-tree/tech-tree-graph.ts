// Basic graph node & graph state types for automatic tech tree inference.
import { FactionType } from "@fuzzy-waddle/api-interfaces";
import type { TechTreeNode } from "./tech-tree-node";

export type TechNodeKind = "Unit" | "Building" | "Upgrade";

export interface TechTreeGraph {
  faction: FactionType;
  nodes: Record<string, TechTreeNode>;
}
