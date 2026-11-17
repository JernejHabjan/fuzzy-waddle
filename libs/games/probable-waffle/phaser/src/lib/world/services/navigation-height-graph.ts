import {
  BOTTOM,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
  type Direction,
  js as EasyStar,
  LEFT,
  RIGHT,
  TOP,
  TOP_LEFT,
  TOP_RIGHT
} from "easystarjs";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type Phaser from "phaser";
import { environment } from "@fuzzy-waddle/environments/environment";
import { NavigablePathDirection } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/navigable-path-direction";
import {
  HEIGHT_NAVIGATION_DIRECTIONS,
  HeightNavigationGraphBuilder,
  type HeightNavigationCell,
  type HeightNavigationEdge,
  type HeightNavigationGraph
} from "./height-navigation-graph-builder";

/** Owns the current native directed graph and mirrors its rules into static and overlay pathfinders. */
export class NavigationHeightGraph {
  private heightMapGrid: HeightNavigationCell[][] = [];
  private heightNavigationGraph?: HeightNavigationGraph;
  /** Debug-only conditions from the most recent static configuration; empty when debug is disabled. */
  readonly directionalConditions = new Map<string, Direction[]>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly DEBUG_CLICK_INFO: boolean
  ) {}

  /** The existing graph reference, without scanning or copying topology. */
  getHeightGraphDebugSnapshot(): HeightNavigationGraph | undefined {
    return this.heightNavigationGraph;
  }

  // Populate heightMapGrid with directed, exact-height navigation graph info.
  // The EasyStar grid answers "can stand here"; the height graph answers
  // "which neighbor transitions are legal from here".
  build(grid: number[][]) {
    this.heightNavigationGraph = new HeightNavigationGraphBuilder(this.scene, this.tilemap).build(grid);
    this.heightMapGrid = this.heightNavigationGraph.cells;
  }

  /** Configures the persistent ground instance in the original eight-direction order. */
  configureStatic(easyStar: EasyStar): void {
    // For each tile, set directional conditions based on heightMapGrid
    this.directionalConditions.clear(); // Clear previous conditions
    for (let y = 0; y < this.heightMapGrid.length; y++) {
      for (let x = 0; x < this.heightMapGrid[y]!.length; x++) {
        const cell = this.heightMapGrid[y]![x]!;
        if (!cell.isNavigable) continue;
        const allowedDirections: Direction[] = [];

        // Check all 8 directions
        const directions: { dir: Direction; dx: number; dy: number; name: NavigablePathDirection }[] = [
          { dir: TOP, dx: 0, dy: -1, name: NavigablePathDirection.Top },
          { dir: BOTTOM, dx: 0, dy: 1, name: NavigablePathDirection.Bottom },
          { dir: LEFT, dx: -1, dy: 0, name: NavigablePathDirection.Left },
          { dir: RIGHT, dx: 1, dy: 0, name: NavigablePathDirection.Right },
          { dir: TOP_LEFT, dx: -1, dy: -1, name: NavigablePathDirection.TopLeft },
          { dir: TOP_RIGHT, dx: 1, dy: -1, name: NavigablePathDirection.TopRight },
          { dir: BOTTOM_LEFT, dx: -1, dy: 1, name: NavigablePathDirection.BottomLeft },
          { dir: BOTTOM_RIGHT, dx: 1, dy: 1, name: NavigablePathDirection.BottomRight }
        ];

        const checkDirection = (dir: Direction, dx: number, dy: number) => {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < this.heightMapGrid.length && nx >= 0 && nx < this.heightMapGrid[ny]!.length) {
            if (this.canTraverseBetween({ x, y }, { x: nx, y: ny })) allowedDirections.push(dir);
          }
        };

        directions.forEach(({ dir, dx, dy }) => {
          checkDirection(dir, dx, dy);
        });

        easyStar.setDirectionalCondition(x, y, allowedDirections);
        if (this.DEBUG_CLICK_INFO && !environment.production) {
          this.directionalConditions.set(`${x}_${y}`, allowedDirections); // Store for debug
        }
      }
    }
  }

  /**
   * Returns the static height-graph cell for a tile, including whether it is
   * navigable, which height layer it belongs to, and which directed ports it exposes.
   * @param tile Logical tile coordinates in the navigation grid.
   */
  getNavigationCell(tile: Vector2Simple): HeightNavigationCell | undefined {
    return this.heightMapGrid[tile.y]?.[tile.x];
  }

  /**
   * Returns the directed exits that are valid from this tile according to the
   * current height graph. Debug tools use this to explain missing connections.
   * @param tile Logical tile coordinates in the navigation grid.
   */
  getAllowedDirectionsAtTile(tile: Vector2Simple): NavigablePathDirection[] {
    const edges = this.heightNavigationGraph?.edgesByTileKey.get(`${tile.x},${tile.y}`) ?? [];
    return edges.map((edge) => edge.direction);
  }

  /**
   * Checks whether the static height graph contains a directed edge from one
   * tile to the next. This is stricter than "both tiles are navigable".
   * @param from Source tile.
   * @param to Neighbor tile being tested as the directed destination.
   */
  canTraverseBetween(from: Vector2Simple, to: Vector2Simple): boolean {
    const edges = this.heightNavigationGraph?.edgesByTileKey.get(`${from.x},${from.y}`) ?? [];
    return edges.some((edge) => edge.to.x === to.x && edge.to.y === to.y);
  }

  /**
   * Returns the traversable connected component starting at startTile.
   * sameHeightOnly is used by formation assignment so groups prefer one
   * elevated platform before spilling onto connected lower/higher tiles.
   * @param startTile Tile where the graph walk starts.
   * @param options Optional same-height and traversal-limit settings.
   */
  getConnectedNavigableTiles(
    startTile: Vector2Simple,
    options: { sameHeightOnly?: boolean; maxTiles?: number } = {}
  ): Vector2Simple[] {
    const startCell = this.getNavigationCell(startTile);
    if (!startCell?.isNavigable || !this.heightNavigationGraph) return [];

    const sameHeightOnly = options.sameHeightOnly ?? false;
    const maxTiles = options.maxTiles ?? 64;
    const result: Vector2Simple[] = [];
    const visited = new Set<string>();
    const queue: Vector2Simple[] = [{ x: startTile.x, y: startTile.y }];
    visited.add(`${startTile.x},${startTile.y}`);

    while (queue.length > 0 && result.length < maxTiles) {
      const current = queue.shift()!;
      const currentCell = this.getNavigationCell(current);
      if (!currentCell?.isNavigable) continue;
      if (!sameHeightOnly || currentCell.navigableHeight === startCell.navigableHeight) {
        result.push(current);
      }

      const edges = this.getSortedEdges(current);
      for (const edge of edges) {
        const key = `${edge.to.x},${edge.to.y}`;
        if (visited.has(key)) continue;
        const nextCell = this.getNavigationCell(edge.to);
        if (!nextCell?.isNavigable) continue;
        if (sameHeightOnly && nextCell.navigableHeight !== startCell.navigableHeight) continue;
        visited.add(key);
        queue.push({ x: edge.to.x, y: edge.to.y });
      }
    }

    return result;
  }

  /**
   * Mirrors the static height graph into an EasyStar instance. Callers can pass
   * an overlay grid so a path query keeps the same directional rules while also
   * honoring temporary blocked tiles.
   * @param easyStar The pathfinder instance being configured for one query.
   * @param navigationGrid The blocked/unblocked grid that limits destination tiles.
   */
  configureOverlay(easyStar: EasyStar, navigationGrid: number[][]): void {
    for (let y = 0; y < navigationGrid.length; y++) {
      for (let x = 0; x < navigationGrid[y]!.length; x++) {
        if (navigationGrid[y]![x] !== 0) continue;
        // Only edges that exist in the height graph and whose destination tile
        // stays unblocked in this overlay grid are exposed to EasyStar.
        const allowedDirections = this.getSortedEdges({ x, y })
          .filter((edge) => navigationGrid[edge.to.y]?.[edge.to.x] === 0)
          .map((edge) => this.toEasyStarDirection(edge.direction));
        easyStar.setDirectionalCondition(x, y, allowedDirections);
      }
    }
  }

  private getSortedEdges(tile: Vector2Simple): HeightNavigationEdge[] {
    const edges = this.heightNavigationGraph?.edgesByTileKey.get(`${tile.x},${tile.y}`) ?? [];
    return [...edges].sort((a, b) => {
      const directionDelta = this.getDirectionSortIndex(a.direction) - this.getDirectionSortIndex(b.direction);
      if (directionDelta !== 0) return directionDelta;
      if (a.to.y !== b.to.y) return a.to.y - b.to.y;
      return a.to.x - b.to.x;
    });
  }

  private getDirectionSortIndex(direction: NavigablePathDirection): number {
    return HEIGHT_NAVIGATION_DIRECTIONS.findIndex((entry) => entry.direction === direction);
  }

  private toEasyStarDirection(direction: NavigablePathDirection): Direction {
    switch (direction) {
      case NavigablePathDirection.Top:
        return TOP;
      case NavigablePathDirection.Bottom:
        return BOTTOM;
      case NavigablePathDirection.Left:
        return LEFT;
      case NavigablePathDirection.Right:
        return RIGHT;
      case NavigablePathDirection.TopLeft:
        return TOP_LEFT;
      case NavigablePathDirection.TopRight:
        return TOP_RIGHT;
      case NavigablePathDirection.BottomLeft:
        return BOTTOM_LEFT;
      case NavigablePathDirection.BottomRight:
        return BOTTOM_RIGHT;
    }
  }

  /**
   * Gets the navigable height at a specific tile position.
   * Returns the height (in px) at which units should stand when on this tile.
   * @param tile The tile coordinates to check
   * @returns The navigable height in pixels, or 0 if tile is out of bounds or not available
   */
  public getNavigableHeightAtTile(tile: Vector2Simple): number {
    // Validate Y coordinate and row existence
    const row = this.heightMapGrid[tile.y];
    if (!row || tile.y < 0) {
      console.warn(`getNavigableHeightAtTile: tile Y coordinate ${tile.y} is out of bounds`);
      return 0;
    }
    // Validate X coordinate
    if (tile.x < 0 || tile.x >= row.length) {
      console.warn(`getNavigableHeightAtTile: tile X coordinate ${tile.x} is out of bounds`);
      return 0;
    }
    const cell = row[tile.x];
    return cell?.navigableHeight ?? 0;
  }
}
