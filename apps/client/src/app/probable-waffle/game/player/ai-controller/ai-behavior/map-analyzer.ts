import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { NavigationService } from "../../../world/services/navigation.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { PlayerAiBlackboard } from "../player-ai-blackboard";
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

  /**
   * Convenience: perform analysis (respecting TTL) AND push results into the AI blackboard.
   * Returns the (possibly cached) MapAnalysis.
   */
  analyzeAndUpdateBlackboard(blackboard: PlayerAiBlackboard, ttlMs: number = 2500): MapAnalysis {
    const result = this.analyzeIfStale(ttlMs);
    // Write-through to blackboard (centralizes this logic here instead of agent)
    blackboard.mapAnalysis = result;
    blackboard.baseCenterTile = result.baseCenterTile ?? null;
    blackboard.suggestedBuildTiles = result.candidateBuildSpots ?? [];
    return result;
  }

  isStale(ttlMs: number) {
    return !this.lastResult || Date.now() - this.lastComputedAt >= ttlMs;
  }

  getLastResult(): MapAnalysis | undefined {
    return this.lastResult;
  }

  scoreBuildSpot(tile: Vector2Simple, baseCenter?: Vector2Simple): number {
    if (!baseCenter) return 0;
    // Prefer moderate distance (not too close, not too far)
    const d = this.manhattan(tile, baseCenter);
    const ideal = 6;
    return Math.max(0, 10 - Math.abs(ideal - d));
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
      analysis.candidateBuildSpots = this.sampleCandidateBuildSpots(navigation, analysis.baseCenterTile);
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

  private sampleCandidateBuildSpots(navigation: NavigationService, base: Vector3Simple): Vector3Simple[] {
    const spots: Vector3Simple[] = [];
    const maxTry = 120; // sampling attempts
    const radius = 10;
    const minSpacing = 3; // tiles between suggested spots

    for (let i = 0; i < maxTry; i++) {
      const tile = navigation.randomTileInRadius(base, radius);
      if (!tile) continue;

      if (!navigation.isWithinGridBounds(tile) || !navigation.isTileWalkable(tile)) continue;

      // Spacing filter
      if (spots.some((s) => this.manhattan(s, tile) < minSpacing)) continue;
      spots.push({ x: tile.x, y: tile.y, z: 0 });
      if (spots.length >= 12) break;
    }

    // Sort by score (best first)
    return spots.sort((a, b) => this.scoreBuildSpot(b, base) - this.scoreBuildSpot(a, base));
  }

  private manhattan(a: Vector2Simple, b: Vector2Simple): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
