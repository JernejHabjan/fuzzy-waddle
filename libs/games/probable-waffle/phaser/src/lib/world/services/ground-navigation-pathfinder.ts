import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { js as EasyStar } from "easystarjs";
import { NavigationProvenance } from "./navigation-provenance";
import type { NavigationNativeQuery } from "./navigation-native-query";
import type { NavigationHeightGraph } from "./navigation-height-graph";

/** Owns native ground EasyStar queries and a one-second cache whose routes are isolated from movement consumers. */
export class GroundNavigationPathfinder {
  private readonly easyStar = new EasyStar();
  // Movement consumes paths with shift(); cached routes must retain their original tiles for later range probes.
  private readonly pathCache = new Map<
    string,
    {
      path: readonly Readonly<Vector2Simple>[] | null;
      timestamp: number;
      query: NavigationNativeQuery | null;
    }
  >();
  private static readonly PATH_CACHE_TTL_MS = 1000;

  constructor(
    private readonly heightGraph: Pick<NavigationHeightGraph, "configureStatic" | "configureOverlay">,
    private readonly DEBUG: boolean,
    private readonly drawPath: (path: Vector2Simple[]) => void,
    private readonly provenance = new NavigationProvenance()
  ) {}

  clearCache(): void {
    this.pathCache.clear();
    this.provenance.cleared("ground");
  }

  /** Retains request-time wall-clock TTL and null/empty results; each caller owns its mutable route and tile objects. */
  async findPath(fromTileXY: Vector2Simple, toTileXY: Vector2Simple): Promise<Vector2Simple[] | null> {
    // Create cache key
    const cacheKey = `${fromTileXY.x},${fromTileXY.y}->${toTileXY.x},${toTileXY.y}`;
    const now = performance.now();

    // Check cache
    const cached = this.pathCache.get(cacheKey);
    const hit = !!cached && now - cached.timestamp < GroundNavigationPathfinder.PATH_CACHE_TTL_MS;
    const query = this.provenance.query(
      "ground_static",
      fromTileXY,
      toTileXY,
      hit ? "hit" : "miss",
      now,
      hit ? cached?.query : null
    );
    if (hit && cached) {
      this.provenance.completed(query);
      return this.copyPath(cached.path);
    }

    return new Promise((resolve) => {
      this.easyStar.findPath(fromTileXY.x, fromTileXY.y, toTileXY.x, toTileXY.y, (path) => {
        const result = !path ? null : path.length === 0 ? [] : path;
        const cachedPath = this.copyPath(result);

        if (this.DEBUG && result) {
          this.drawPath(result);
        }

        // Cache the result
        this.pathCache.set(cacheKey, { path: cachedPath, timestamp: now, query });
        this.provenance.completed(query);

        // Periodically clean up old cache entries
        if (this.pathCache.size > 1000) {
          this.cleanPathCache(now);
        }

        resolve(result);
      });
      this.easyStar.calculate();
    });
  }

  /** Copy at insertion and cache delivery: neither array consumption nor tile edits can corrupt another query. */
  private copyPath(path: readonly Readonly<Vector2Simple>[] | null): Vector2Simple[] | null {
    return path?.map((tile) => ({ ...tile })) ?? null;
  }

  /**
   * Runs a one-off EasyStar path query against a caller-supplied overlay grid.
   * This is used for dynamic blocker recovery so temporary occupancy can block
   * tiles without mutating the shared cached navigation grid.
   * @param fromTileXY Start tile for the path query.
   * @param toTileXY Destination tile for the path query.
   * @param navigationGrid Temporary blocked/unblocked overlay grid.
   * @param useHeightGraphDirections Whether to enforce directed height transitions.
   */
  async findPathWithGrid(
    fromTileXY: Vector2Simple,
    toTileXY: Vector2Simple,
    navigationGrid: number[][],
    useHeightGraphDirections: boolean
  ): Promise<Vector2Simple[] | null> {
    const query = this.provenance.query("ground_overlay", fromTileXY, toTileXY, "bypass", null);
    const easyStar = new EasyStar();
    easyStar.setGrid(navigationGrid);
    easyStar.setAcceptableTiles([0]);
    easyStar.enableDiagonals();
    if (useHeightGraphDirections) {
      // Reapply static directed height edges against this temporary grid so
      // dynamic blockers cannot re-enable invalid wall/stairs transitions.
      this.heightGraph.configureOverlay(easyStar, navigationGrid);
    }
    return new Promise((resolve) => {
      easyStar.findPath(fromTileXY.x, fromTileXY.y, toTileXY.x, toTileXY.y, (path) => {
        this.provenance.completed(query);
        resolve(!path ? null : path.length === 0 ? [] : path);
      });
      easyStar.calculate();
    });
  }

  private cleanPathCache(now: number = performance.now()): void {
    for (const [key, value] of this.pathCache.entries()) {
      if (now - value.timestamp >= GroundNavigationPathfinder.PATH_CACHE_TTL_MS) {
        this.pathCache.delete(key);
      }
    }
  }

  /** Configures the already-built grid and graph; the scene owner clears caches after the complete setup. */
  setup(grid: number[][]) {
    this.easyStar.setGrid(grid);
    this.easyStar.setAcceptableTiles([0]);
    this.easyStar.enableDiagonals();
    this.heightGraph.configureStatic(this.easyStar);
    this.provenance.configured("ground");
  }
}
