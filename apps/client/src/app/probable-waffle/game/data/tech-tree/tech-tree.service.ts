// Runtime service that stores unified tech graph & per-player unlock state.
import type { TechTreeGraph } from "./tech-tree-graph";
import {
  FactionType,
  ObjectNames,
  type PlayerNumber,
  PreRequirement,
  ResearchType
} from "@fuzzy-waddle/api-interfaces";
import { TechTreeBuilder } from "./tech-tree.builder";
import { getCanonicalActorNameCached } from "./canonical-actor-name";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { environment } from "../../../../../environments/environment";
import { shouldConsiderActorUnlocked } from "./actor-unlock-utils";
import { FactionDefinitions } from "../../player/faction-definitions";

export class TechTreeService {
  private readonly graph: TechTreeGraph;
  // Per-player unlock tracking (keyed by player number)
  private readonly playerUnlocks = new Map<number, Set<ObjectNames>>();
  // Per-player research tracking (keyed by player number)
  private readonly playerResearch = new Map<number, Set<ResearchType>>();
  // Faction membership cache to avoid recomputation
  private readonly factionCache = new Map<FactionType, Set<ObjectNames>>();

  constructor() {
    this.graph = TechTreeBuilder.build();
    // Validate tech tree structure on initialization
    if (!environment.production) {
      const errors = this.validateTechTree();
      if (errors.length > 0) {
        console.warn("[TechTreeService] Tech tree validation errors:", errors);
      }
    }
  }

  /**
   * Build faction membership sets by traversing the graph from main buildings.
   * This discovers all units and buildings reachable from a faction's starting point.
   */
  private buildFactionSets(): void {
    for (const faction of FactionDefinitions.factions) {
      const factionObjects = new Set<ObjectNames>();
      const mainBuilding = this.getMainBuildingForFaction(faction.type);
      const visited = new Set<ObjectNames>();
      const toProcess = [mainBuilding];

      // BFS to find all objects reachable from main building
      while (toProcess.length > 0) {
        const current = toProcess.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        factionObjects.add(current);

        const node = this.graph.nodes[current];
        if (!node) continue;

        // Add all units this building can produce
        for (const produced of node.produces) {
          if (!visited.has(produced)) {
            toProcess.push(produced);
          }
        }

        // Add all buildings this unit/building can construct
        for (const constructed of node.constructs) {
          if (!visited.has(constructed)) {
            toProcess.push(constructed);
          }
        }
      }

      this.factionCache.set(faction.type, factionObjects);
    }
  }

  /**
   * Check if an object belongs to a specific faction.
   * Uses cached faction sets built from graph traversal.
   */
  private isFactionMatch(objectName: ObjectNames, factionType: FactionType): boolean {
    // Build faction sets on first access
    if (this.factionCache.size === 0) {
      this.buildFactionSets();
    }

    const factionSet = this.factionCache.get(factionType);
    return factionSet ? factionSet.has(objectName) : false;
  }

  getMainBuildingForFaction(factionType: FactionType): ObjectNames {
    const objectName = FactionDefinitions.factions.find((f) => f.type === factionType)?.value.mainBuildingActorName;
    if (objectName) return objectName;
    throw new Error(`Unknown faction type: ${factionType}`);
  }

  /**
   * Initialize unlocks for a player by scanning their existing actors.
   * Should be called after loading a game or when a player joins.
   */
  initializePlayerUnlocks(playerNumber: PlayerNumber, existingActors: Phaser.GameObjects.GameObject[]) {
    const unlocks = new Set<ObjectNames>();

    existingActors.forEach((actor) => {
      const actorName = actor.name as ObjectNames;
      if (actorName && shouldConsiderActorUnlocked(actor)) {
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
   * Note: This should typically be called from ConstructionSiteComponent.finishConstruction
   * to ensure buildings are only unlocked when finished, not when construction starts.
   */
  registerActorUnlock(playerNumber: PlayerNumber, actorName: ObjectNames) {
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
  unregisterActorUnlock(playerNumber: PlayerNumber, actorName: ObjectNames, remainingCount: number) {
    if (remainingCount > 0) return; // Still have instances, keep unlocked

    const unlocks = this.playerUnlocks.get(playerNumber);
    if (unlocks) {
      // Use canonical name to group variants
      const canonicalName = getCanonicalActorNameCached(actorName);
      unlocks.delete(canonicalName);
    }
  }

  getGraph(): TechTreeGraph {
    return this.graph;
  }

  isUnlocked(playerNumber: PlayerNumber, id: ObjectNames | string): boolean {
    const unlocks = this.playerUnlocks.get(playerNumber);
    return unlocks ? unlocks.has(id as ObjectNames) : false;
  }

  /**
   * Get prerequisites for a target actor that are not yet unlocked.
   * Returns both object and research prerequisites.
   * @param playerNumber - The player to check unlocks for
   * @param target - The actor to get prerequisites for
   */
  getPrerequisites(playerNumber: PlayerNumber, target: ObjectNames): PreRequirement {
    const node = this.graph.nodes[target];
    if (!node) throw new Error(`Tech tree node not found for ${target}`);

    const neededObjects = new Set<ObjectNames>();
    const neededResearch = new Set<ResearchType>();
    const visitedObjects = new Set<ObjectNames>();

    const visit = (objectName: ObjectNames) => {
      if (visitedObjects.has(objectName)) return;
      visitedObjects.add(objectName);

      const n = this.graph.nodes[objectName];
      if (!n) return;

      // Only skip if unlocked AND not the target itself
      // We must always check the target's prerequisites, even if the target was built before
      const isUnlocked = this.isUnlocked(playerNumber, objectName);
      if (isUnlocked && objectName !== target) {
        return;
      }

      // Recursively visit object prerequisites
      for (const prereqObject of n.prerequisites.prereqs.objectNames) {
        visit(prereqObject);
      }

      // Collect research prerequisites
      for (const prereqResearch of n.prerequisites.prereqs.researchTypes) {
        if (!this.isResearched(playerNumber, prereqResearch)) {
          neededResearch.add(prereqResearch);
        }
      }

      // Add to needed if not unlocked and not the target itself
      if (!isUnlocked && objectName !== target) {
        neededObjects.add(objectName);
      }
    };

    visit(target);

    // Also check target's own research requirements
    for (const prereqResearch of node.prerequisites.prereqs.researchTypes) {
      if (!this.isResearched(playerNumber, prereqResearch)) {
        neededResearch.add(prereqResearch);
      }
    }

    return new PreRequirement({
      objectNames: Array.from(neededObjects),
      researchTypes: Array.from(neededResearch),
      resources: {},
      supply: null
    });
  }

  getNode(id: ObjectNames) {
    return this.graph.nodes[id];
  }

  isAvailable(playerNumber: PlayerNumber, id: ObjectNames): boolean {
    if (this.isUnlocked(playerNumber, id)) return true;
    const prereqs = this.getPrerequisites(playerNumber, id);
    return prereqs.canProduce;
  }

  /**
   * Get the full definition for an actor from the tech tree.
   * This provides access to embedded definitions for validation.
   */
  getDefinition(id: ObjectNames) {
    return this.graph.nodes[id]?.definition;
  }

  /**
   * Get all units that can be produced by a specific building.
   */
  getProducibleUnits(buildingId: ObjectNames): ObjectNames[] {
    return this.graph.nodes[buildingId]?.produces || [];
  }

  isDefensiveBuilding(buildingId: ObjectNames): boolean {
    const node = this.graph.nodes[buildingId];
    if (!node) return false;

    const attackComponent = node.definition?.components?.attack;
    return attackComponent !== undefined;
  }

  isHousingBuilding(buildingId: ObjectNames): boolean {
    const node = this.graph.nodes[buildingId];
    if (!node) return false;

    const housingComponent = node.definition?.components?.housing;
    return housingComponent !== undefined;
  }

  /**
   * Get all buildings that can be constructed by a specific unit.
   */
  getConstructableBuildings(unitId: ObjectNames): ObjectNames[] {
    const node = this.graph.nodes[unitId];
    if (!node) return [];

    // If we already have a pre-computed list from the graph, return it
    if (node.constructs && node.constructs.length > 0) {
      return node.constructs;
    }

    // Otherwise, extract from the builder component definition
    const builderComponent = node.definition?.components?.builder;
    if (!builderComponent?.constructableBuildings) return [];

    return BuilderComponent.getFlatConstructableBuildings(builderComponent.constructableBuildings);
  }

  /**
   * Get all housing buildings.
   * Returns array of ObjectNames that have housing components.
   * @param factionType - Optional faction filter (Tivara or Skaduwee)
   */
  getHousingBuildingsExcludingMain(factionType?: FactionType): ObjectNames[] {
    return Object.entries(this.graph.nodes)
      .filter(
        ([, node]) => node.definition.components?.housing !== undefined && node.definition.meta?.isMainBuilding !== true
      )
      .filter(([id]) => !factionType || this.isFactionMatch(id as ObjectNames, factionType))
      .map(([id]) => id as ObjectNames);
  }

  /**
   * Get all defensive buildings (have attack component).
   * @param factionType - Optional faction filter (Tivara or Skaduwee)
   */
  getDefensiveBuildingsExcludingMain(factionType?: FactionType): ObjectNames[] {
    return Object.entries(this.graph.nodes)
      .filter(
        ([, node]) =>
          node.definition.components?.attack !== undefined &&
          node.definition.components?.production !== undefined &&
          node.definition.meta?.isMainBuilding !== true
      )
      .filter(([id]) => !factionType || this.isFactionMatch(id as ObjectNames, factionType))
      .map(([id]) => id as ObjectNames);
  }

  /**
   * Get all production buildings (have production component).
   * @param factionType - Optional faction filter (Tivara or Skaduwee)
   */
  getProductionBuildingsExcludingMain(factionType?: FactionType): ObjectNames[] {
    return Object.entries(this.graph.nodes)
      .filter(
        ([, node]) =>
          node.definition.components?.production !== undefined && node.definition.meta?.isMainBuilding !== true
      )
      .filter(([id]) => !factionType || this.isFactionMatch(id as ObjectNames, factionType))
      .map(([id]) => id as ObjectNames);
  }

  getResourceGatheringBuildingsExcludingMain(): ObjectNames[] {
    return Object.entries(this.graph.nodes)
      .filter(
        ([, node]) =>
          node.definition.components?.resourceDrain !== undefined && node.definition.meta?.isMainBuilding !== true
      )
      .map(([id]) => id as ObjectNames);
  }

  /**
   * Get all ranged units (have attack component with ranged property).
   */
  getRangedInfantryUnits(filterFrom?: ObjectNames[]): ObjectNames[] {
    const allRanged = Object.entries(this.graph.nodes)
      .filter(([, node]) => {
        const gatherer = node.definition.components?.gatherer;
        if (gatherer) return false; // Exclude gatherers
        const attack = node.definition.components?.attack;
        return attack && attack.attacks.find((attackData) => attackData.range > 2) !== undefined;
      })
      .map(([id]) => id as ObjectNames);

    if (filterFrom) {
      const filterSet = new Set(filterFrom);
      return allRanged.filter((unit) => filterSet.has(unit));
    }
    return allRanged;
  }

  /**
   * Get all melee units (have attack component with no range or range 0).
   */
  getMeleeInfantryUnits(filterFrom?: ObjectNames[]): ObjectNames[] {
    const allMelee = Object.entries(this.graph.nodes)
      .filter(([, node]) => {
        const gatherer = node.definition.components?.gatherer;
        if (gatherer) return false; // Exclude gatherers
        const attack = node.definition.components?.attack;
        return attack && !attack.attacks.find((attackData) => attackData.range > 2);
      })
      .map(([id]) => id as ObjectNames);

    if (filterFrom) {
      const filterSet = new Set(filterFrom);
      return allMelee.filter((unit) => filterSet.has(unit));
    }
    return allMelee;
  }

  /**
   * Get all resource buildings.
   * @param factionType - Optional faction filter (Tivara or Skaduwee)
   */
  getResourceBuildingsExcludingMain(factionType?: FactionType): ObjectNames[] {
    return Object.entries(this.graph.nodes)
      .filter(
        ([, node]) =>
          node.definition.components?.resourceSource !== undefined && node.definition.meta?.isMainBuilding !== true
      )
      .filter(([id]) => !factionType || this.isFactionMatch(id as ObjectNames, factionType))
      .map(([id]) => id as ObjectNames);
  }

  /**
   * Validate that the tech tree is properly structured.
   * Returns any validation errors found.
   */
  validateTechTree(): string[] {
    const errors: string[] = [];

    // Validate each node
    Object.entries(this.graph.nodes).forEach(([id, node]) => {
      // Check that definition exists
      if (!node.definition) {
        errors.push(`Node ${id} missing definition`);
      }

      // Check that all prerequisites exist in the graph
      node.prerequisites.prereqs.objectNames.forEach((prereq) => {
        if (!this.graph.nodes[prereq]) {
          errors.push(`Node ${id} has prerequisite ${prereq} that doesn't exist in graph`);
        }
      });

      node.prerequisites.prereqs.researchTypes.forEach((researchType) => {
        // Research types are not nodes, so we just check that they are valid enum values
        if (!Object.values(ResearchType).includes(researchType)) {
          errors.push(`Node ${id} has prerequisite research ${researchType} that is not a valid ResearchType`);
        }
      });

      // Check that all produces targets exist
      node.produces.forEach((producible) => {
        if (!this.graph.nodes[producible]) {
          errors.push(`Node ${id} produces ${producible} that doesn't exist in graph`);
        }
      });

      // Check that all constructs targets exist
      node.constructs.forEach((constructable) => {
        if (!this.graph.nodes[constructable]) {
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
        const constructables = BuilderComponent.getFlatConstructableBuildings(builderComponent.constructableBuildings);

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
          if (!node.prerequisites.prereqs.objectNames.includes(req as ObjectNames)) {
            errors.push(`Node ${id} definition requires ${req} but it's not in node.prerequisites`);
          }
        });
      }
    });

    return errors;
  }

  // ========== Research Tracking ==========

  /**
   * Register a research as completed for a player.
   */
  registerResearchComplete(playerNumber: number, researchType: ResearchType): void {
    let research = this.playerResearch.get(playerNumber);
    if (!research) {
      research = new Set<ResearchType>();
      this.playerResearch.set(playerNumber, research);
    }
    research.add(researchType);
  }

  /**
   * Check if a research has been completed by a player.
   */
  isResearched(playerNumber: number, researchType: ResearchType): boolean {
    const research = this.playerResearch.get(playerNumber);
    return research ? research.has(researchType) : false;
  }

  /**
   * Get all completed research for a player.
   */
  getPlayerResearch(playerNumber: number): Set<ResearchType> {
    return this.playerResearch.get(playerNumber) ?? new Set();
  }

  /**
   * Initialize research state for a player from saved data.
   */
  setPlayerResearch(playerNumber: number, researchTypes: ResearchType[]): void {
    this.playerResearch.set(playerNumber, new Set(researchTypes));
  }

  /**
   * Get research data for saving.
   */
  getResearchData(): Map<number, ResearchType[]> {
    const data = new Map<number, ResearchType[]>();
    for (const [playerNumber, research] of this.playerResearch) {
      data.set(playerNumber, Array.from(research));
    }
    return data;
  }
}
