// Basic graph node & graph state types for automatic tech tree inference.
import { FactionType } from "@fuzzy-waddle/api-interfaces";
import type { TechTreeNode } from "./tech-tree-node";

export interface TechTreeGraph {
  faction: FactionType;
  nodes: Record<string, TechTreeNode>;
}
