// Pure builder that infers tech graph from prefab actor definitions.
import { type TechTreeGraph } from "./tech-tree-graph";
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import type { TechTreeNode } from "./tech-tree-node";

/**
 * Recursively gather all actors that belong to a faction starting from a main building.
 * An actor belongs to a faction if it can be built, trained, or is required by actors in that faction.
 */
function gatherFactionActors(mainBuildingName: ObjectNames, definitions: typeof pwActorDefinitions): Set<ObjectNames> {
  const factionActors = new Set<ObjectNames>();
  const visited = new Set<ObjectNames>();

  function visit(actorName: ObjectNames) {
    if (visited.has(actorName)) return;
    visited.add(actorName);
    factionActors.add(actorName);

    const definition = definitions[actorName];
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

  visit(mainBuildingName);
  return factionActors;
}

export class TechTreeBuilder {
  /**
   * Build per-faction graphs by recursively gathering actors from main buildings.
   *
   * Algorithm:
   * 1. Start from each faction's main building (Sandhold, FrostForge)
   * 2. Recursively follow production, construction, and requirement relationships
   * 3. Build complete faction actor sets
   * 4. Create nodes and infer all relationships
   */
  static build(): Record<FactionType, TechTreeGraph> {
    // Step 1: Gather all actors for each faction recursively
    const tivaraActors = gatherFactionActors(ObjectNames.Sandhold, pwActorDefinitions);
    const skaduweeActors = gatherFactionActors(ObjectNames.FrostForge, pwActorDefinitions);

    const graphs: Record<FactionType, TechTreeGraph> = {
      [FactionType.Tivara]: { faction: FactionType.Tivara, nodes: {} },
      [FactionType.Skaduwee]: { faction: FactionType.Skaduwee, nodes: {} }
    } as const;

    const factionActorSets = {
      [FactionType.Tivara]: tivaraActors,
      [FactionType.Skaduwee]: skaduweeActors
    } satisfies Record<FactionType, Set<ObjectNames>>;

    // Step 2: Create nodes for all faction actors
    Object.values(FactionType).forEach((factionLoop) => {
      const faction = factionLoop as FactionType;
      const actorSet = factionActorSets[faction];
      if (!actorSet) return;

      actorSet.forEach((actorName: ObjectNames) => {
        const definition = pwActorDefinitions[actorName];
        if (!definition) return;

        const components = definition.components || {};
        let kind: "Unit" | "Building" | "Upgrade" = "Unit";
        if (components.production || components.constructable) {
          kind = "Building";
        }

        // noinspection UnnecessaryLocalVariableJS
        const node: TechTreeNode = {
          id: actorName,
          faction,
          kind,
          prerequisites: [],
          produces: [],
          constructs: [],
          definition
        };

        graphs[faction].nodes[actorName] = node;
      });
    });

    // Step 3: Build prerequisite relationships from requirements
    Object.values(FactionType).forEach((factionLoop) => {
      const faction = factionLoop as FactionType;

      const actorSet = factionActorSets[faction];
      if (!actorSet) return;

      actorSet.forEach((actorName) => {
        const node = graphs[faction].nodes[actorName];
        if (!node) return;

        const definition = pwActorDefinitions[actorName];
        const requirements = definition?.components?.requirements?.actors;

        if (requirements && Array.isArray(requirements)) {
          requirements.forEach((requiredActor) => {
            // Only add prerequisite if the required actor exists in this faction's graph
            if (graphs[faction].nodes[requiredActor] && !node.prerequisites.includes(requiredActor)) {
              node.prerequisites.push(requiredActor);
            }
          });
        }
      });
    });

    // Step 4: Build production and construction edges
    Object.values(FactionType).forEach((factionLoop) => {
      const faction = factionLoop as FactionType;
      const actorSet = factionActorSets[faction];
      if (!actorSet) return;

      actorSet.forEach((actorName) => {
        const fromNode = graphs[faction].nodes[actorName];
        if (!fromNode) return;

        const definition = pwActorDefinitions[actorName];
        const components = definition?.components || {};

        // Production edges
        const producible = components.production?.availableProduceActors;
        if (Array.isArray(producible)) {
          producible.forEach((producedActor) => {
            const producedActorName = producedActor as ObjectNames;
            const producedNode = graphs[faction].nodes[producedActorName];

            if (producedNode) {
              if (!fromNode.produces.includes(producedActorName)) {
                fromNode.produces.push(producedActorName);
              }

              // Add prerequisite: produced unit requires this building
              if (!producedNode.prerequisites.includes(fromNode.id)) {
                producedNode.prerequisites.push(fromNode.id);
              }
            }
          });
        }

        // Construction edges
        if (components.builder?.constructableBuildings) {
          const constructable = BuilderComponent.getFlatConstructableBuildings(
            components.builder.constructableBuildings
          );
          constructable.forEach((buildingObjectName) => {
            const buildingNode = graphs[faction].nodes[buildingObjectName];

            if (buildingNode) {
              if (!fromNode.constructs.includes(buildingObjectName)) {
                fromNode.constructs.push(buildingObjectName);
              }

              // Add prerequisite: building requires this builder unit
              if (!buildingNode.prerequisites.includes(fromNode.id)) {
                buildingNode.prerequisites.push(fromNode.id);
              }
            }
          });
        }
      });
    });

    return graphs;
  }
}
