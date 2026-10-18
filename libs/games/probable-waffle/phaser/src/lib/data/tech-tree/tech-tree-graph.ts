// Basic graph node & graph state types for automatic tech tree inference.
import type { TechTreeNode } from "./tech-tree-node";

export interface TechTreeGraph {
  nodes: Record<string, TechTreeNode>;
}
