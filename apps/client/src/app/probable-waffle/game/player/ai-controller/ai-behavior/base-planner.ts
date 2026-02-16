import { type MapAnalysis, MapAnalyzer } from "./map-analyzer";
import { FactionType, ObjectNames, ResourceType, type Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { NavigationService } from "../../../world/services/navigation.service";
import { RandomService } from "../../../world/services/random.service";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { SupplyPlanner } from "./supply-planner";
import { ProductionValidator } from "../../../data/tech-tree/production-validator";
import { NeedType } from "./need-type";
import { AdaptiveThresholdManager } from "./adaptive-threshold-manager";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { LogisticsManager } from "./logistics-manager";

interface PlannedBuilding {
  id: string;
  type: NeedType;
  tile: Vector2Simple;
  priority: number;
  reservedAt: number;
}

interface BuildingNeed {
  type: NeedType;
  reason: string;
  priority: number;
  resourceType?: ResourceType;
}

/**
 * BasePlanner (phase 2 extended)
 * - Adds heuristic need evaluation of building types (what to build).
 */
export class BasePlanner {
  private plans: PlannedBuilding[] = [];
  private candidateSpots: Vector2Simple[] = [];
  private lastAnalysisVersion = 0;
  private buildingNeeds: BuildingNeed[] = [];
  private lastNeedsComputedAt = 0;
  private readonly reservationTtlMs = 10000; // Expire stale unused reservations
  private accessibilityChecked = false;
  private reservedBuilding: {
    objectName: ObjectNames;
    tile: Vector2Simple;
    needType: string;
    resourceType?: ResourceType; // for gathering buildings
    reservedAt: number;
    planId?: string; //link to blackboard plannedStructures reservation
  } | null = null;

  constructor(
    private readonly analyzer: MapAnalyzer,
    private readonly factionType: FactionType | undefined,
    private readonly supplyPlanner: SupplyPlanner,
    private readonly productionValidator: ProductionValidator,
    private readonly logisticsManager: LogisticsManager
  ) {}

  /**
   * Ensure a reservation exists for the given building type; returns its tile.
   */
  async ensurePlan(buildingType: NeedType, priority = 0, resourceType?: ResourceType): Promise<Vector2Simple | null> {
    this.pruneExpiredReservations();
    const existing = this.plans.find((p) => p.type === buildingType);
    if (existing) return existing.tile;
    // Optionally run accessibility refinement once lazily
    if (!this.accessibilityChecked) {
      const analysis = this.getLatestAnalysis();
      const navigation = getSceneService(this.analyzer["scene"], NavigationService);
      if (navigation && analysis?.baseCenterTile) {
        await this.refineAccessibility(navigation, analysis.baseCenterTile);
      }
    }
    return this.planBuilding(buildingType, priority, resourceType);
  }

  getPlannedTileForType(buildingType: string): Vector2Simple | null {
    return this.plans.find((p) => p.type === buildingType)?.tile ?? null;
  }

  markTileUsed(tile: Vector2Simple) {
    // Remove reservation once construction actually placed
    this.plans = this.plans.filter((p) => !(p.tile.x === tile.x && p.tile.y === tile.y));
  }

  async updateFromAnalysis(analysis: MapAnalysis) {
    // Refresh candidate list only when object identity changed (new analysis pass)
    if (!analysis) return;
    if (analysis.analyzedAtMs === this.lastAnalysisVersion) return;
    this.lastAnalysisVersion = analysis.analyzedAtMs;
    const actorIndex = getSceneService(this.analyzer.scene, ActorIndexSystem);
    const navigation = getSceneService(this.analyzer.scene, NavigationService);
    let candidates = analysis.candidateBuildSpots.slice();
    if (actorIndex) {
      candidates = candidates.filter((t) => actorIndex.isTileFree(t));
    }
    this.candidateSpots = candidates;
    this.accessibilityChecked = false; // reset
    this.pruneInvalidPlans();
    this.pruneExpiredReservations();
    if (navigation && analysis.baseCenterTile) {
      await this.refineAccessibility(navigation, analysis.baseCenterTile);
    }
  }

  getLatestAnalysis(): MapAnalysis | undefined {
    return this.analyzer.getLastResult();
  }

  getPlannedBuildings(): readonly PlannedBuilding[] {
    return this.plans;
  }

  /**
   * Reserve a spot for a building type. Returns chosen tile or null if none.
   */
  planBuilding(buildingType: NeedType, priority = 0, resourceType?: ResourceType): Vector2Simple | null {
    const analysis = this.getLatestAnalysis();
    if (!analysis || !analysis.baseCenterTile) return null;
    const taken = new Set(this.plans.map((p) => `${p.tile.x},${p.tile.y}`));

    // Score each candidate (prefer unused + analyzer score)
    const scored = this.candidateSpots
      .filter((t) => !taken.has(`${t.x},${t.y}`))
      .map((t) => ({
        tile: t,
        score:
          this.analyzer.scoreBuildSpot(t, analysis.baseCenterTile!, buildingType, resourceType) -
          this.distancePenalty(t)
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    const chosen = scored[0]!.tile;
    const randomService = getSceneService(this.analyzer.scene, RandomService)!;
    this.plans.push({
      id: `${Date.now()}-${randomService.random().toString(36).slice(2)}`,
      type: buildingType,
      tile: chosen,
      priority,
      reservedAt: Date.now()
    });
    return chosen;
  }

  releasePlanAt(tile: Vector2Simple) {
    this.plans = this.plans.filter((p) => !(p.tile.x === tile.x && p.tile.y === tile.y));
  }

  consumePlanForType(buildingType: string): PlannedBuilding | null {
    // Retrieve the highest priority plan for the requested type
    let idx = -1;
    let best: PlannedBuilding | null = null;
    this.plans.forEach((p, i) => {
      if (p.type !== buildingType) return;
      if (!best || p.priority > best.priority) {
        best = p;
        idx = i;
      }
    });
    if (idx >= 0) this.plans.splice(idx, 1);
    return best;
  }

  /**
   * High-level helper: if needs are stale, recompute and update the blackboard's plannedBuildingTypes.
   */
  planBaseIfStale(
    blackboard: PlayerAiBlackboard,
    ttlMs: number,
    adaptiveThresholds: AdaptiveThresholdManager
  ): boolean {
    if (!this.isNeedsStale(ttlMs)) return false;
    this.recomputeNeedsAndUpdateBlackboard(blackboard, adaptiveThresholds);
    // Fallback: if no explicit high-priority needs, opportunistically stage a generic reservation
    if (this.buildingNeeds.length === 0) {
      const tile = this.planBuilding(NeedType.Housing, 0); // Simplified fallback
    }
    return true;
  }

  /**
   * Recompute building needs and update blackboard (write-through) – replaces previous agent-side logic.
   */
  recomputeNeedsAndUpdateBlackboard(
    blackboard: PlayerAiBlackboard,
    adaptiveThresholds: AdaptiveThresholdManager
  ): BuildingNeed[] {
    const needs = this.recomputeNeeds(blackboard, adaptiveThresholds);
    blackboard.plannedBuildingTypes = needs.map((n) => n.type);
    return needs;
  }

  /**
   * Ensure a reservation for the highest priority current need.
   * Returns objectName + tile if successful.
   * (Extended: also internally stores the reservation for later resource gating / placement.)
   */
  async ensureReservationForTopNeed(
    blackboard: PlayerAiBlackboard
  ): Promise<{ objectName: ObjectNames; tile: Vector2Simple } | null> {
    this.pruneExpiredReservations();
    if (this.buildingNeeds.length === 0) return null;
    const top = this.buildingNeeds[0];
    if (!top) return null;
    if (this.reservedBuilding && this.reservedBuilding.needType === top.type) {
      return { objectName: this.reservedBuilding.objectName, tile: this.reservedBuilding.tile };
    }
    const objectName = this.mapNeedTypeToObjectName(top.type, (top as any).resourceType);
    if (!objectName) return null;
    const tile = await this.ensurePlan(top.type, top.priority, top.resourceType);
    if (!tile) return null;
    // Attempt resource reservation (best-effort)
    const cost = this.getCostForObjectName(objectName) || {};
    const plan = blackboard.beginPlannedStructure(objectName, cost, Date.now());
    this.reservedBuilding = {
      objectName,
      tile,
      needType: top.type,
      resourceType: (top as any).resourceType,
      reservedAt: Date.now(),
      planId: plan ? plan.id : undefined
    };
    return { objectName, tile };
  }

  getReservedBuilding(): { objectName: ObjectNames; tile: Vector2Simple } | null {
    if (!this.reservedBuilding) return null;
    return { objectName: this.reservedBuilding.objectName, tile: this.reservedBuilding.tile };
  }

  hasResourcesForReservedBuilding(blackboard: PlayerAiBlackboard): boolean {
    if (!this.reservedBuilding) return false;
    return this.hasResourcesForObjectName(this.reservedBuilding.objectName, blackboard);
  }

  clearReservedBuilding() {
    this.reservedBuilding = null;
  }

  /**
   * Recompute building needs based on current blackboard snapshot.
   * (Phase 2 heuristic: simple thresholds)
   */
  recomputeNeeds(blackboard: PlayerAiBlackboard, adaptiveThresholds: AdaptiveThresholdManager): BuildingNeed[] {
    const now = Date.now();
    this.buildingNeeds = [];

    // Assess supply & proactively plan housing if needed
    const supply = this.supplyPlanner.assess(now);

    // Housing pressure
    let housingPriority = 0;
    switch (supply.urgency) {
      case "none":
        break;
      case "normal":
        housingPriority = 80;
        break;
      case "emergency":
        housingPriority = 100;
        break;
    }
    if (housingPriority > 0) {
      this.buildingNeeds.push({
        type: NeedType.Housing,
        reason: "Low housing buffer",
        priority: housingPriority
      });
    }

    // If economy is low, only focus on gathering and housing
    const isEconomyLow = blackboard.getTotalResources() < adaptiveThresholds.getResourceGatheringThreshold();
    if (isEconomyLow) {
      // find most needed resource and add a gathering need
      const mostNeeded = this.logisticsManager.getMostConstrainedResource();
      if (mostNeeded) {
        const resourceType = mostNeeded;
        const hasGatheringBuildingForResource = blackboard.gatheringStructures.some((building) => {
          const def = pwActorDefinitions[building.name as ObjectNames];
          const drain = def?.components?.resourceDrain;
          return drain?.resourceTypes.includes(resourceType);
        });

        if (!hasGatheringBuildingForResource) {
          this.buildingNeeds.push({
            type: NeedType.Gathering,
            reason: `Shortage of ${resourceType}`,
            priority: 90, // high priority when economy is low
            resourceType: resourceType
          });
        }
      }
    } else {
      // Production expansion
      const busyProductionBuildings = blackboard.productionBuildings.filter((b) => {
        const prod = getActorComponent(b, ProductionComponent);
        return prod && !prod.isIdle;
      }).length;
      const productionBuildingRatio =
        blackboard.productionBuildings.length > 0 ? busyProductionBuildings / blackboard.productionBuildings.length : 0;

      if (productionBuildingRatio > 0.7) {
        // if more than 70% are busy
        this.buildingNeeds.push({
          type: NeedType.Production,
          reason: "High production load",
          priority: 70
        });
      }

      // Defense gap
      const desiredDefensiveStructures =
        Math.floor(blackboard.baseSize / 3) + Math.floor(blackboard.enemyMilitaryStrength / 100); // e.g. 1 defense for every 3 buildings and some for enemy strength
      if (blackboard.defensiveStructures.length < desiredDefensiveStructures) {
        this.buildingNeeds.push({
          type: NeedType.Defense,
          reason: "Defense gap detected",
          priority: 60
        });
      }

      // Gathering boost based on resource shortages
      const mostNeeded = this.logisticsManager.getMostConstrainedResource();
      if (mostNeeded) {
        const resourceType = mostNeeded;
        const hasGatheringBuildingForResource = blackboard.gatheringStructures.some((building) => {
          const def = pwActorDefinitions[building.name as ObjectNames];
          const drain = def?.components?.resourceDrain;
          return drain?.resourceTypes.includes(resourceType);
        });

        if (!hasGatheringBuildingForResource) {
          this.buildingNeeds.push({
            type: NeedType.Gathering,
            reason: `Shortage of ${resourceType}`,
            priority: 50, // This could be dynamic based on shortage severity
            resourceType: resourceType
          });
        }
      }
    }

    // Sort by priority descending
    this.buildingNeeds.sort((a, b) => b.priority - a.priority);
    this.lastNeedsComputedAt = now;
    return this.buildingNeeds;
  }

  isNeedsStale(ttlMs: number): boolean {
    return Date.now() - this.lastNeedsComputedAt >= ttlMs;
  }

  getCurrentNeeds(): BuildingNeed[] {
    return this.buildingNeeds;
  }

  /**
   * Translate need type to concrete object enum value using tech tree.
   * Data-driven approach: finds first available building of required type.
   */
  mapNeedTypeToObjectName(needType: NeedType, resourceType?: ResourceType): ObjectNames | null {
    const techTree = getSceneService(this.analyzer.scene, TechTreeService);
    if (!techTree || !this.factionType) return null;

    let candidates: ObjectNames[] = [];

    switch (needType) {
      case NeedType.Housing:
        candidates = techTree.getHousingBuildingsExcludingMain(this.factionType);
        break;
      case NeedType.Production:
        candidates = techTree.getProductionBuildingsExcludingMain(this.factionType);
        break;
      case NeedType.Defense:
        candidates = techTree.getDefensiveBuildingsExcludingMain(this.factionType);
        break;
      case NeedType.Gathering:
        candidates = techTree.getResourceGatheringBuildingsExcludingMain();
        if (resourceType) {
          // Filter by resource type
          candidates = candidates.filter((c) => {
            const def = pwActorDefinitions[c];
            const drain = def?.components?.resourceDrain;
            return drain?.resourceTypes.includes(resourceType);
          });
        }
        break;
    }

    // Filter out tech-locked buildings
    const unlockedCandidates = candidates.filter((candidate) => {
      const validation = this.productionValidator.validate(candidate);
      // allow queue if it can be queued or if it's only blocked by resources/supply (not tech/building prereqs)
      const hasObjectOrResearchPrereqs =
        validation.prereqs.objectNames.length > 0 || validation.prereqs.researchTypes.length > 0;
      return validation.canQueue || !hasObjectOrResearchPrereqs;
    });

    if (unlockedCandidates.length === 0) {
      // consider scheduling prerequisites
      if (candidates.length > 0) {
        const validation = this.productionValidator.validate(candidates[0]!);
        const hasPrereqs =
          validation.prereqs.objectNames.length > 0 ||
          validation.prereqs.researchTypes.length > 0 ||
          Object.keys(validation.prereqs.resources).length > 0 ||
          (validation.prereqs.supply !== null && validation.prereqs.supply > 0);

        if (hasPrereqs) {
          this.productionValidator.schedulePrerequisites(validation, candidates[0]!);
        }
      }
      return null;
    }

    // Pick the cheapest one
    unlockedCandidates.sort((a, b) => {
      const costA = Object.values(this.getCostForObjectName(a) ?? {}).reduce((acc, val) => acc + (val ?? 0), 0);
      const costB = Object.values(this.getCostForObjectName(b) ?? {}).reduce((acc, val) => acc + (val ?? 0), 0);
      return costA - costB;
    });

    return unlockedCandidates.length > 0 ? unlockedCandidates[0]! : null;
  }

  /**
   * Internal: When scoring candidates, optionally penalize dangerously close to existing actors.
   */
  private distancePenalty(tile: Vector2Simple): number {
    // Penalize being too close to existing planned buildings (encourage dispersion)
    let penalty = 0;
    this.plans.forEach((p) => {
      const d = Math.abs(p.tile.x - tile.x) + Math.abs(p.tile.y - tile.y);
      if (d < 3) penalty += 5 - d; // stronger penalty for very close tiles
    });
    return penalty;
  }

  private pruneInvalidPlans() {
    const spotSet = new Set(this.candidateSpots.map((t) => `${t.x},${t.y}`));
    this.plans = this.plans.filter((p) => spotSet.has(`${p.tile.x},${p.tile.y}`));
  }

  /**
   * Attempt to remove unreachable candidate spots  *
   */
  private async refineAccessibility(navigation: NavigationService, origin: Vector2Simple) {
    //
    if (this.accessibilityChecked) return;
    this.candidateSpots = this.candidateSpots.filter(async (t) => {
      const path = await navigation.findPathBetweenTiles(origin, t); // small path limit
      return Array.isArray(path) && path.length > 0;
    });
    this.accessibilityChecked = true;
  }

  private pruneExpiredReservations() {
    const now = Date.now();
    this.plans = this.plans.filter((p) => now - p.reservedAt < this.reservationTtlMs);
    // Release outdated reservedBuilding link (resource reservation pruned elsewhere)
    if (this.reservedBuilding && now - this.reservedBuilding.reservedAt >= this.reservationTtlMs) {
      this.reservedBuilding = null;
    }
  }

  // --- Cost & resource helpers ---

  getCostForObjectName(objectName: ObjectNames): Partial<Record<ResourceType, number>> | undefined {
    const definition = pwActorDefinitions[objectName];
    return definition?.components?.productionCost?.resources;
  }

  hasResourcesForObjectName(objectName: ObjectNames, blackboard: PlayerAiBlackboard): boolean {
    const cost = this.getCostForObjectName(objectName);
    if (!cost) return true;
    return blackboard.hasAtLeastResources(cost);
  }
}
