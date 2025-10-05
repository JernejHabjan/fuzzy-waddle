import { type MapAnalysis, MapAnalyzer } from "./map-analyzer";
import { ObjectNames, ResourceType, type Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { NavigationService } from "../../../world/services/navigation.service";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { PlayerAiBlackboard } from "../player-ai-blackboard";

interface PlannedBuilding {
  id: string;
  type: string;
  tile: Vector2Simple;
  priority: number;
  reservedAt: number;
}

interface BuildingNeed {
  type: NeedType;
  reason: string;
  priority: number;
}

enum NeedType {
  Housing = "Housing",
  Production = "Production",
  Defense = "Defense"
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
    reservedAt: number;
    planId?: string; //link to blackboard plannedStructures reservation
  } | null = null;

  constructor(private readonly analyzer: MapAnalyzer) {}

  /**
   * Ensure a reservation exists for the given building type; returns its tile.
   */
  async ensurePlan(buildingType: string, priority = 0): Promise<Vector2Simple | null> {
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
    return this.planBuilding(buildingType, priority);
  }

  getPlannedTileForType(buildingType: string): Vector2Simple | null {
    return this.plans.find((p) => p.type === buildingType)?.tile ?? null;
  }

  markTileUsed(tile: Vector2Simple) {
    // Remove reservation once construction actually placed
    this.plans = this.plans.filter((p) => !(p.tile.x === tile.x && p.tile.y === tile.y));
  }

  updateFromAnalysis(analysis: MapAnalysis) {
    // Refresh candidate list only when object identity changed (new analysis pass)
    if (!analysis) return;
    if (analysis.analyzedAtMs === this.lastAnalysisVersion) return;
    this.lastAnalysisVersion = analysis.analyzedAtMs;
    const actorIndex = getSceneService(this.analyzer["scene"], ActorIndexSystem);
    const navigation = getSceneService(this.analyzer["scene"], NavigationService);
    let candidates = analysis.candidateBuildSpots.slice();
    if (actorIndex) {
      candidates = candidates.filter((t) => actorIndex.isTileFree(t));
    }
    this.candidateSpots = candidates;
    this.accessibilityChecked = false; // reset
    this.pruneInvalidPlans();
    this.pruneExpiredReservations();
    if (navigation && analysis.baseCenterTile) {
      this.refineAccessibility(navigation, analysis.baseCenterTile);
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
  planBuilding(buildingType: string, priority = 0): Vector2Simple | null {
    const analysis = this.getLatestAnalysis();
    if (!analysis || !analysis.baseCenterTile) return null;
    const taken = new Set(this.plans.map((p) => `${p.tile.x},${p.tile.y}`));

    // Score each candidate (prefer unused + analyzer score)
    const scored = this.candidateSpots
      .filter((t) => !taken.has(`${t.x},${t.y}`))
      .map((t) => ({
        tile: t,
        score: this.analyzer.scoreBuildSpot(t, analysis.baseCenterTile!) - this.distancePenalty(t)
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) return null;

    const chosen = scored[0]!.tile;
    this.plans.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
    // Retrieve highest priority plan for the requested type
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

  chooseNextBuildingAndLocation(): { buildingName: string; tile: Vector2Simple } | null {
    // Placeholder heuristic: if fewer than 3 reservations, queue generic "House"
    if (this.plans.length >= 3) return null;
    const tile = this.planBuilding("House", 0);
    if (!tile) return null;
    return { buildingName: "House", tile };
  }

  /**
   * High-level helper: if needs are stale, recompute and update the blackboard's plannedBuildingTypes.
   */
  planBaseIfStale(blackboard: PlayerAiBlackboard, ttlMs: number): boolean {
    if (!this.isNeedsStale(ttlMs)) return false;
    this.recomputeNeedsAndUpdateBlackboard(blackboard);
    return true;
  }

  /**
   * Recompute building needs and update blackboard (write-through) – replaces previous agent-side logic.
   */
  recomputeNeedsAndUpdateBlackboard(blackboard: PlayerAiBlackboard): BuildingNeed[] {
    const needs = this.recomputeNeeds(blackboard);
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
    const objectName = this.mapNeedTypeToObjectName(top.type);
    if (!objectName) return null;
    const tile = await this.ensurePlan(top.type, top.priority);
    if (!tile) return null;
    // Attempt resource reservation (best-effort)
    const cost = this.getCostForObjectName(objectName) || {};
    const plan = blackboard.beginPlannedStructure(objectName, cost, Date.now());
    this.reservedBuilding = {
      objectName,
      tile,
      needType: top.type,
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
  recomputeNeeds(blackboard: PlayerAiBlackboard): BuildingNeed[] {
    const now = Date.now();
    this.buildingNeeds = [];

    // Housing pressure
    if (blackboard.housingCapacity <= blackboard.units.length + 3) {
      this.buildingNeeds.push({
        type: NeedType.Housing,
        reason: "Low housing buffer",
        priority: 90
      });
    }

    // Production expansion
    if (blackboard.productionBuildings.length < blackboard.desiredProductionBuildings) {
      this.buildingNeeds.push({
        type: NeedType.Production,
        reason: "Below desired production count",
        priority: 70
      });
    }

    // Defense gap
    if (blackboard.defensiveStructures.length < blackboard.desiredDefensiveStructures) {
      this.buildingNeeds.push({
        type: NeedType.Defense,
        reason: "Below desired defense count",
        priority: 60
      });
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
   * Translate highest priority need into a concrete buildable type label.
   * Mapping can later become data-driven.
   */
  getNextNeededType(): string | null {
    if (this.buildingNeeds.length === 0) return null;
    const top = this.buildingNeeds[0];
    if (!top) return null;
    switch (top.type) {
      case "Housing":
        return "WorkMill"; // placeholder mapping
      case "Production":
        return "Owlery"; // placeholder mapping
      case "Defense":
        return "InfantryInn"; // placeholder mapping
      default:
        return null;
    }
  }

  /**
   * Translate need type to concrete object enum value.
   */
  mapNeedTypeToObjectName(needType: NeedType): ObjectNames | null {
    switch (needType) {
      case NeedType.Housing:
        return ObjectNames.WorkMill;
      case NeedType.Production:
        return ObjectNames.Owlery;
      case NeedType.Defense:
        return ObjectNames.InfantryInn;
      default:
        return null;
    }
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
      try {
        const path = await navigation.find(origin, t); // small path limit
        return Array.isArray(path) && path.length > 0;
      } catch {
        return true;
      }
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
