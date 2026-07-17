// Pure builder that infers tech graph from prefab actor definitions.
import { type TechTreeGraph } from "./tech-tree-graph";
import { ObjectNames, PreRequirement } from "@fuzzy-waddle/api-interfaces";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import type { TechTreeNode } from "./tech-tree-node";

/**
 * Recursively gather all actors starting from main buildings.
 * This creates a unified tech tree containing actors from all factions.
 */
function gatherAllActors(mainBuildingNames: ObjectNames[]): Set<ObjectNames> {
  const allActors = new Set<ObjectNames>();
  const visited = new Set<ObjectNames>();

  function visit(actorName: ObjectNames) {
    if (visited.has(actorName)) return;
    visited.add(actorName);
    allActors.add(actorName);

    const definition = getPwActorDefinition(actorName, null);
    if (!definition) return;

    const components = definition.components || {};

    // Add all actors that can be produced by this building
    const producible = components.production?.availableProduceActors || [];
    producible.forEach((actor) => visit(actor as ObjectNames));

    // Add all buildings that can be constructed by this unit
    if (components.builder?.constructableBuildings) {
      const constructable = BuilderComponent.getFlatConstructableBuildings(components.builder.constructableBuildings);
      constructable.forEach((building) => visit(building as ObjectNames));
    }

    // Add all required actors (tech requirements)
    const requirements = components.requirements?.actors || [];
    requirements.forEach((required) => visit(required as ObjectNames));
  }

  mainBuildingNames.forEach((mainBuilding) => visit(mainBuilding));
  return allActors;
}

export class TechTreeBuilder {
  /**
   * Build a unified tech tree graph containing all actors from all factions.
   *
   * Algorithm:
   * 1. Start from all main buildings (Sandhold, FrostForge)
   * 2. Recursively follow production, construction, and requirement relationships
   * 3. Build complete actor set
   * 4. Create nodes and infer all relationships
   */
  static build(): TechTreeGraph {
    // Step 1: Gather all actors from all factions
    const allActors = gatherAllActors([ObjectNames.Sandhold, ObjectNames.FrostForge]);

    const graph: TechTreeGraph = { nodes: {} };

    // Step 2: Create nodes for all actors
    allActors.forEach((actorName: ObjectNames) => {
      const definition = getPwActorDefinition(actorName, null);
      if (!definition) return;

      const components = definition.components || {};
      let kind: "Unit" | "Building" | "Upgrade" = "Unit";
      if (components.production || components.constructable) {
        kind = "Building";
      }

      const node: TechTreeNode = {
        id: actorName,
        kind,
        prerequisites: new PreRequirement(),
        produces: [],
        constructs: [],
        definition
      };

      graph.nodes[actorName] = node;
    });

    // Step 3: Build prerequisite relationships from requirements
    allActors.forEach((actorName) => {
      const node = graph.nodes[actorName];
      if (!node) return;

      const definition = getPwActorDefinition(actorName, null);
      const requirements = definition?.components?.requirements?.actors;

      // Add object (building/unit) prerequisites
      if (requirements && Array.isArray(requirements)) {
        requirements.forEach((requiredActor) => {
          // Only add prerequisite if the required actor exists in the graph
          if (graph.nodes[requiredActor] && !node.prerequisites.prereqs.objectNames.includes(requiredActor)) {
            node.prerequisites.prereqs.objectNames.push(requiredActor);
          }
        });
      }

      // NOTE: We do NOT add spell research as prerequisites for unit creation.
      // Units can be created even if their spells aren't researched yet.
      // Spell research only gates whether those spells can be cast, not whether the unit can be produced.
      // This is handled at the spell usage level via SpellComponent.isSpellResearched()
    });

    // Step 4: Build production and construction edges
    allActors.forEach((actorName) => {
      const fromNode = graph.nodes[actorName];
      if (!fromNode) return;

      const definition = getPwActorDefinition(actorName, null);
      const components = definition?.components || {};

      // Production edges
      const producible = components.production?.availableProduceActors;
      if (Array.isArray(producible)) {
        producible.forEach((producedActor) => {
          const producedActorName = producedActor as ObjectNames;
          const producedNode = graph.nodes[producedActorName];

          if (producedNode) {
            if (!fromNode.produces.includes(producedActorName)) {
              fromNode.produces.push(producedActorName);
            }

            // Add prerequisite: produced unit requires this building
            if (!producedNode.prerequisites.prereqs.objectNames.includes(fromNode.id)) {
              producedNode.prerequisites.prereqs.objectNames.push(fromNode.id);
            }
          }
        });
      }

      // Construction edges
      if (components.builder?.constructableBuildings) {
        const constructable = BuilderComponent.getFlatConstructableBuildings(components.builder.constructableBuildings);
        constructable.forEach((buildingObjectName) => {
          const buildingNode = graph.nodes[buildingObjectName];

          if (buildingNode) {
            if (!fromNode.constructs.includes(buildingObjectName)) {
              fromNode.constructs.push(buildingObjectName);
            }

            // NOTE: We do NOT add the builder as a tech prerequisite for buildings.
            // Buildings only need builders to physically construct them, not as tech unlocks.
            // Tech prerequisites come from the building's `requirements` component only.
          }
        });
      }
    });

    return graph;
  }
}
