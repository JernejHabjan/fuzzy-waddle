import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { NavigationService } from "../../../world/services/navigation.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { NeedType } from "./need-type";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

// Lightweight result of a map analysis pass
export interface MapAnalysis {
  baseCenterTile?: Vector3Simple;
  candidateBuildSpots: Vector3Simple[];
  analyzedAtMs: number;
}

/**
 * MapAnalyzer
 * - Gathers spatial intel needed by BasePlanner and high-level AI.
 * - Uses ActorIndexSystem + NavigationService, caches results for a short TTL.
 */
export class MapAnalyzer {
  private lastResult: MapAnalysis | undefined;
  private lastComputedAt = 0;

  constructor(
    public readonly scene: Phaser.Scene,
    private readonly playerNumber: number
  ) {}

  /**
   * Compute analysis if stale, otherwise return cached.
   */
  async analyzeIfStale(ttlMs: number = 2500): Promise<MapAnalysis> {
    const now = Date.now();
    if (this.lastResult && now - this.lastComputedAt < ttlMs) {
      return this.lastResult;
    }
    const result = await this.computeAnalysis();
    this.lastResult = result;
    this.lastComputedAt = now;
    return result;
  }

  isStale(ttlMs: number) {
    return !this.lastResult || Date.now() - this.lastComputedAt >= ttlMs;
  }

  getLastResult(): MapAnalysis | undefined {
    return this.lastResult;
  }

  scoreBuildSpot(
    tile: Vector2Simple,
    baseCenter?: Vector2Simple,
    buildingType?: NeedType,
    resourceType?: ResourceType
  ): number {
    if (!baseCenter) return 0;

    let score = 0;
    const distanceToBase = this.manhattan(tile, baseCenter);
    const navigation = getSceneService(this.scene, NavigationService);
    if (!navigation) return 0;

    switch (buildingType) {
      case NeedType.Gathering:
        // score based on proximity to the specified resource
        const actorIndex = getSceneService(this.scene, ActorIndexSystem);
        if (actorIndex && resourceType) {
          const resourceNodes = actorIndex.getResourceSourcesFiltered(resourceType);
          let minDistance = Infinity;
          for (const node of resourceNodes) {
            const nodeTile = navigation.getCenterTileCoordUnderObject(node);
            if (nodeTile) {
              const d = this.manhattan(tile, nodeTile);
              if (d < minDistance) {
                minDistance = d;
              }
            }
          }
          // Higher score for being closer to a resource node.
          score += Math.max(0, 50 - minDistance * 2);
        }
        // also some score for being not too far from base
        score += Math.max(0, 20 - distanceToBase);
        break;
      case NeedType.Production:
        // score based on proximity to base center
        score += Math.max(0, 30 - distanceToBase);
        break;
      case NeedType.Defense:
        // score based on being on the perimeter
        const idealDefenseDistance = 10; // for example
        score += Math.max(0, 20 - Math.abs(distanceToBase - idealDefenseDistance));
        // could also add score for being on a choke point or path to enemy
        break;
      case NeedType.Housing:
      default:
        // Prefer moderate distance (not too close, not too far)
        const ideal = 6;
        score += Math.max(0, 10 - Math.abs(distanceToBase - ideal));
        break;
    }

    return score;
  }

  private async computeAnalysis(): Promise<MapAnalysis> {
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    const navigation = getSceneService(this.scene, NavigationService);

    const analysis: MapAnalysis = {
      baseCenterTile: undefined,
      candidateBuildSpots: [],
      analyzedAtMs: Date.now()
    };

    if (!actorIndex || !navigation) {
      // Services not ready yet
      return analysis;
    }

    const owned = actorIndex.getOwnedActors(this.playerNumber) as GameObject[];
    if (owned.length === 0) {
      return analysis;
    }

    // 1) Estimate base center by averaging center tiles of owned buildings/units
    const ownedTiles: Vector3Simple[] = [];
    owned.forEach((obj) => {
      const tile = navigation.getCenterTileCoordUnderObject(obj);
      if (tile) ownedTiles.push({ x: tile.x, y: tile.y, z: 0 });
    });
    if (ownedTiles.length > 0) {
      analysis.baseCenterTile = this.averageTile(ownedTiles);
    }

    // 2) Find candidate build spots around base center (walkable, spaced out)
    if (analysis.baseCenterTile) {
      analysis.candidateBuildSpots = await this.sampleCandidateBuildSpots(navigation, analysis.baseCenterTile);
    }

    return analysis;
  }

  private averageTile(tiles: Vector3Simple[]): Vector3Simple {
    const sum = tiles.reduce(
      (acc, t) => {
        acc.x += t.x;
        acc.y += t.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    return { x: Math.round(sum.x / tiles.length), y: Math.round(sum.y / tiles.length), z: 0 };
  }

  private async sampleCandidateBuildSpots(
    navigation: NavigationService,
    base: Vector3Simple
  ): Promise<Vector3Simple[]> {
    const spots: Vector3Simple[] = [];
    const maxTry = 20; // sampling attempts
    const radius = 20; // todo this must be dynamic based on current base size
    const minSpacing = 3; // tiles between suggested spots
    const maxSpots = 3;

    for (let i = 0; i < maxTry; i++) {
      const tile = navigation.randomTileInRadius(base, radius);
      if (!tile) continue;

      if (!navigation.isWithinGridBounds(tile) || !navigation.isTileWalkable(tile)) continue;

      const path = await navigation.findPathBetweenTiles(base, tile);
      if (!path || !path.length) continue; // too close or unreachable
      if (path.length > radius) continue; // too far

      // Check spacing from existing spots
      let tooClose = false;
      for (const s of spots) {
        if (this.manhattan(s, tile) < minSpacing) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      spots.push({ x: tile.x, y: tile.y, z: 0 });

      if (spots.length >= maxSpots) break;
    }

    // Sort by score (best first)
    return spots.sort((a, b) => this.scoreBuildSpot(b, base) - this.scoreBuildSpot(a, base));
  }

  private manhattan(a: Vector2Simple, b: Vector2Simple): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
