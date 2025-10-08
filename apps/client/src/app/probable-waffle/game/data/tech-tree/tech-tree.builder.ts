// Pure builder that infers tech graph from prefab actor definitions.
import { type TechTreeGraph, type TechTreeNode } from "./tech-tree.types";
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";

function detectFaction(objectName: string): FactionType | null {
  // todo
  if (objectName.toLowerCase().includes("tivara")) return FactionType.Tivara;
  if (objectName.toLowerCase().includes("skaduwee")) return FactionType.Skaduwee;
  return null;
}

function isWorkerName(name: string): boolean {
  return /tivara.*worker/i.test(name) || /skaduwee.*worker/i.test(name); // todo
}

export class TechTreeBuilder {
  // Build per-faction graphs (workers used as roots) with produce & construct edges.
  static build(): Record<FactionType, TechTreeGraph> {
    const graphs: Record<FactionType, TechTreeGraph> = {
      [FactionType.Tivara]: { faction: FactionType.Tivara, nodes: {}, roots: [] },
      [FactionType.Skaduwee]: { faction: FactionType.Skaduwee, nodes: {}, roots: [] }
    } as const;

    // First pass: create nodes & identify roots
    Object.entries(pwActorDefinitions).forEach(([key, def]) => {
      const faction = detectFaction(key);
      if (!faction) return;
      const id = key as ObjectNames;
      const node: TechTreeNode = {
        id,
        faction,
        kind: "Unit", // default; will refine below
        prerequisites: [],
        produces: [],
        constructs: []
      };
      const components = def.components || {};
      if (components.production) node.kind = "Building";
      if (components.builder) node.kind = node.kind === "Building" ? "Building" : "Unit";
      graphs[faction].nodes[id] = node;
      if (isWorkerName(key)) {
        graphs[faction].roots.push(id);
      }
    });

    // Second pass: add edges
    Object.entries(pwActorDefinitions).forEach(([key, def]) => {
      const faction = detectFaction(key);
      if (!faction) return;
      const components = def.components || {};
      const fromNode = graphs[faction].nodes[key];
      if (!fromNode) return;
      // Production edges
      const produce: string[] | undefined = components.production?.availableProduceActors;
      if (Array.isArray(produce)) {
        produce.forEach((p) => {
          if (graphs[faction].nodes[p]) {
            fromNode.produces.push(p as ObjectNames);
            // Add prerequisite link on produced node
            const producedNode = graphs[faction].nodes[p];
            if (producedNode && !producedNode.prerequisites.includes(fromNode.id)) {
              producedNode.prerequisites.push(fromNode.id);
            }
          }
        });
      }
      // Construction edges (workers / builders)
      const constructs: string[] | undefined = components.builder?.constructableBuildings;
      if (Array.isArray(constructs)) {
        constructs.forEach((b) => {
          if (graphs[faction].nodes[b]) {
            fromNode.constructs.push(b as ObjectNames);
            const buildingNode = graphs[faction].nodes[b];
            if (buildingNode && !buildingNode.prerequisites.includes(fromNode.id)) {
              buildingNode.prerequisites.push(fromNode.id);
            }
          }
        });
      }
    });

    return graphs;
  }
}
