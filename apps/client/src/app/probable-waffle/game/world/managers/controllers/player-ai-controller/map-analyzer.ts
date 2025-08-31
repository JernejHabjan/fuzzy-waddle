import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;
import { NavigationService } from "../../../services/navigation.service";
import { ActorIndexSystem } from "../../../services/ActorIndexSystem";
import { getSceneService } from "../../../components/scene-component-helpers";

// Lightweight result of a map analysis pass
export interface MapAnalysis {
  baseCenterTile?: Vector2Simple;
  candidateBuildSpots: Vector2Simple[];
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
    private readonly scene: Phaser.Scene,
    private readonly playerNumber: number
  ) {}

  /**
   * Compute analysis if stale, otherwise return cached.
   */
  analyzeIfStale(ttlMs: number = 2500): MapAnalysis {
    const now = Date.now();
    if (this.lastResult && now - this.lastComputedAt < ttlMs) {
      return this.lastResult;
    }
    const result = this.computeAnalysis();
    this.lastResult = result;
    this.lastComputedAt = now;
    return result;
  }

  private computeAnalysis(): MapAnalysis {
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
    const ownedTiles: Vector2Simple[] = [];
    owned.forEach((obj) => {
      const tile = navigation.getCenterTileCoordUnderObject(obj);
      if (tile) ownedTiles.push(tile);
    });
    if (ownedTiles.length > 0) {
      analysis.baseCenterTile = this.averageTile(ownedTiles);
    }

    // 2) Find candidate build spots around base center (walkable, spaced out)
    if (analysis.baseCenterTile) {
      analysis.candidateBuildSpots = this.sampleCandidateBuildSpots(navigation, analysis.baseCenterTile);
    }

    return analysis;
  }

  private averageTile(tiles: Vector2Simple[]): Vector2Simple {
    const sum = tiles.reduce(
      (acc, t) => {
        acc.x += t.x;
        acc.y += t.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    return { x: Math.round(sum.x / tiles.length), y: Math.round(sum.y / tiles.length) };
  }

  private sampleCandidateBuildSpots(navigation: NavigationService, base: Vector2Simple): Vector2Simple[] {
    const spots: Vector2Simple[] = [];
    const maxTry = 120; // sampling attempts
    const radius = 10;
    const minSpacing = 3; // tiles between suggested spots

    for (let i = 0; i < maxTry; i++) {
      const tile = navigation.randomTileInRadius(base, radius);
      if (!tile) continue;

      if (!navigation.isWithinGridBounds(tile) || !navigation.isTileWalkable(tile)) continue;

      // Spacing filter
      if (spots.some((s) => this.manhattan(s, tile) < minSpacing)) continue;
      spots.push(tile);
      if (spots.length >= 12) break;
    }
    return spots;
  }

  private manhattan(a: Vector2Simple, b: Vector2Simple): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
