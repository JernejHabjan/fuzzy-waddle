// Runtime service that stores per-faction tech graphs & per-player unlock state.
import type { TechTreeGraph } from "./tech-tree.types";
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { TechTreeBuilder } from "./tech-tree.builder";
import { getCanonicalActorNameCached } from "./canonical-actor-name";

export class TechTreeService {
  private readonly graphs: Record<FactionType, TechTreeGraph>;
  // Per-player unlock tracking (keyed by player number)
  private readonly playerUnlocks = new Map<number, Set<ObjectNames>>();

  constructor() {
    this.graphs = TechTreeBuilder.build();
    // Validate tech tree structure on initialization
    this.validateAllTechTrees();
  }

  /**
   * Validate tech trees for all factions and log any errors.
   * This ensures the tech tree is properly constructed from definitions.
   */
  private validateAllTechTrees() {
    const allErrors: string[] = [];

    // Iterate over the actual faction values (not enum keys)
    const factions = [FactionType.Tivara, FactionType.Skaduwee];

    factions.forEach((faction) => {
      const errors = this.validateTechTree(faction);
      if (errors.length > 0) {
        allErrors.push(`[${FactionType[faction]}]`, ...errors);
      }
    });

    if (allErrors.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("[TechTreeService] Tech tree validation errors:", allErrors);
    } else {
      // eslint-disable-next-line no-console
      console.log("[TechTreeService] Tech tree validation passed for all factions");
    }
  }

  /**
   * Initialize unlocks for a player by scanning their existing actors.
   * Should be called after loading a game or when a player joins.
   */
  initializePlayerUnlocks(playerNumber: number, existingActors: Phaser.GameObjects.GameObject[]) {
    const unlocks = new Set<ObjectNames>();

    existingActors.forEach((actor) => {
      const actorName = actor.name as ObjectNames;
      if (actorName) {
        // Use canonical name to group variants (e.g., TivaraWorkerMale -> TivaraWorker)
        const canonicalName = getCanonicalActorNameCached(actorName);
        unlocks.add(canonicalName);
      }
    });

    this.playerUnlocks.set(playerNumber, unlocks);
  }

  /**
   * Register an actor as unlocked for a player.
   * Called when an actor is created/spawned.
   */
  registerActorUnlock(playerNumber: number, actorName: ObjectNames) {
    let unlocks = this.playerUnlocks.get(playerNumber);
    if (!unlocks) {
      unlocks = new Set<ObjectNames>();
      this.playerUnlocks.set(playerNumber, unlocks);
    }

    // Use canonical name to group variants
    const canonicalName = getCanonicalActorNameCached(actorName);
    unlocks.add(canonicalName);
  }

  /**
   * Unregister an actor unlock for a player.
   * Called when the last instance of an actor type is destroyed.
   * Only unlocks the actor if no other instances of that type exist for the player.
   */
  unregisterActorUnlock(playerNumber: number, actorName: ObjectNames, remainingCount: number) {
    if (remainingCount > 0) return; // Still have instances, keep unlocked

    const unlocks = this.playerUnlocks.get(playerNumber);
    if (unlocks) {
      // Use canonical name to group variants
      const canonicalName = getCanonicalActorNameCached(actorName);
      unlocks.delete(canonicalName);
    }
  }

  getGraph(faction: FactionType): TechTreeGraph | undefined {
    return this.graphs[faction];
  }

  isUnlocked(playerNumber: number, id: ObjectNames | string): boolean {
    const unlocks = this.playerUnlocks.get(playerNumber);
    return unlocks ? unlocks.has(id as ObjectNames) : false;
  }

  /**
   * Get prerequisites for a target actor that are not yet unlocked.
   * Returns a Set to avoid duplicates, and excludes the target itself.
   */
  getPrerequisites(playerNumber: number, faction: FactionType, target: ObjectNames): Set<ObjectNames> {
    const graph = this.graphs[faction];
    if (!graph) return new Set();

    const node = graph.nodes[target];
    if (!node) return new Set();

    const needed = new Set<ObjectNames>();
    const visited = new Set<ObjectNames>();

    const visit = (id: ObjectNames) => {
      if (visited.has(id)) return;
      visited.add(id);

      if (this.isUnlocked(playerNumber, id)) return;

      const n = graph.nodes[id];
      if (!n) return;

      // Recursively visit prerequisites
      for (const pre of n.prerequisites) {
        visit(pre);
      }

      // Add to needed if not unlocked and not the target itself
      if (!this.isUnlocked(playerNumber, id) && id !== target) {
        needed.add(id);
      }
    };

    visit(target);
    return needed;
  }

  getNode(faction: FactionType, id: string) {
    return this.graphs[faction]?.nodes[id];
  }

  isAvailable(playerNumber: number, faction: FactionType, id: ObjectNames): boolean {
    return this.isUnlocked(playerNumber, id) || this.getPrerequisites(playerNumber, faction, id).size === 0;
  }

  /**
   * Get the full definition for an actor from the tech tree.
   * This provides access to embedded definitions for validation.
   */
  getDefinition(faction: FactionType, id: ObjectNames) {
    return this.graphs[faction]?.nodes[id]?.definition;
  }

  /**
   * Get all units that can be produced by a specific building.
   */
  getProducibleUnits(faction: FactionType, buildingId: ObjectNames): ObjectNames[] {
    return this.graphs[faction]?.nodes[buildingId]?.produces || [];
  }

  /**
   * Get all buildings that can be constructed by a specific unit.
   */
  getConstructableBuildings(faction: FactionType, unitId: ObjectNames): ObjectNames[] {
    return this.graphs[faction]?.nodes[unitId]?.constructs || [];
  }

  /**
   * Validate that the tech tree is properly structured.
   * Returns any validation errors found.
   */
  validateTechTree(faction: FactionType): string[] {
    const errors: string[] = [];
    const graph = this.graphs[faction];
    if (!graph) {
      errors.push(`No graph found for faction ${faction}`);
      return errors;
    }

    // Validate each node
    Object.entries(graph.nodes).forEach(([id, node]) => {
      // Check that definition exists
      if (!node.definition) {
        errors.push(`Node ${id} missing definition`);
      }

      // Check that all prerequisites exist in the graph
      node.prerequisites.forEach((prereq) => {
        if (!graph.nodes[prereq]) {
          errors.push(`Node ${id} has prerequisite ${prereq} that doesn't exist in graph`);
        }
      });

      // Check that all produces targets exist
      node.produces.forEach((producible) => {
        if (!graph.nodes[producible]) {
          errors.push(`Node ${id} produces ${producible} that doesn't exist in graph`);
        }
      });

      // Check that all constructs targets exist
      node.constructs.forEach((constructable) => {
        if (!graph.nodes[constructable]) {
          errors.push(`Node ${id} constructs ${constructable} that doesn't exist in graph`);
        }
      });

      // Check that building definitions match production component
      if (node.kind === "Building" && node.definition.components?.production) {
        const prodComponent = node.definition.components.production;
        const producibleActors = prodComponent.availableProduceActors || [];

        // Verify produces list matches definition
        producibleActors.forEach((actor) => {
          if (!node.produces.includes(actor as ObjectNames)) {
            errors.push(`Building ${id} definition produces ${actor} but it's not in node.produces`);
          }
        });
      }

      // Check that builder definitions match builder component
      if (node.definition.components?.builder) {
        const builderComponent = node.definition.components.builder;
        const constructables = builderComponent.constructableBuildings || [];

        // Verify constructs list matches definition
        constructables.forEach((building) => {
          if (!node.constructs.includes(building as ObjectNames)) {
            errors.push(`Unit ${id} definition constructs ${building} but it's not in node.constructs`);
          }
        });
      }

      // Check that requirements match prerequisites
      if (node.definition.components?.requirements) {
        const requirements = node.definition.components.requirements.actors || [];
        requirements.forEach((req) => {
          if (!node.prerequisites.includes(req)) {
            errors.push(`Node ${id} has requirement ${req} but it's not in prerequisites`);
          }
        });
      }
    });

    return errors;
  }
}
