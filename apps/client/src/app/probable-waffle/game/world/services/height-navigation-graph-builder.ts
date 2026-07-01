import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import type { NavigablePath } from "../../entity/components/movement/navigable-path";
import { NavigablePathDirection } from "../../entity/components/movement/navigable-path-direction";
import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import type { HeightDirectionPortDefinition } from "../../entity/components/movement/navigable-definition";
import { getActorComponent } from "../../data/actor-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";

export interface HeightNavigationCell {
  x: number;
  y: number;
  navigableHeight: number;
  isNavigable: boolean;
  ports: Partial<Record<NavigablePathDirection, HeightDirectionPortDefinition>>;
  navigableComponent?: NavigableComponent;
}

export interface HeightNavigationEdge {
  from: Vector2Simple;
  to: Vector2Simple;
  direction: NavigablePathDirection;
  exitHeight: number;
  enterHeight: number;
}

export interface HeightNavigationGraph {
  cells: HeightNavigationCell[][];
  edgesByTileKey: Map<string, HeightNavigationEdge[]>;
}

interface DirectionOffset {
  direction: NavigablePathDirection;
  opposite: NavigablePathDirection;
  dx: number;
  dy: number;
}

export const HEIGHT_NAVIGATION_DIRECTIONS: DirectionOffset[] = [
  { direction: NavigablePathDirection.Top, opposite: NavigablePathDirection.Bottom, dx: 0, dy: -1 },
  { direction: NavigablePathDirection.Bottom, opposite: NavigablePathDirection.Top, dx: 0, dy: 1 },
  { direction: NavigablePathDirection.Left, opposite: NavigablePathDirection.Right, dx: -1, dy: 0 },
  { direction: NavigablePathDirection.Right, opposite: NavigablePathDirection.Left, dx: 1, dy: 0 },
  { direction: NavigablePathDirection.TopLeft, opposite: NavigablePathDirection.BottomRight, dx: -1, dy: -1 },
  { direction: NavigablePathDirection.TopRight, opposite: NavigablePathDirection.BottomLeft, dx: 1, dy: -1 },
  { direction: NavigablePathDirection.BottomLeft, opposite: NavigablePathDirection.TopRight, dx: -1, dy: 1 },
  { direction: NavigablePathDirection.BottomRight, opposite: NavigablePathDirection.TopLeft, dx: 1, dy: 1 }
];

export function canConnectHeightNavigationPorts(
  exitPort: HeightDirectionPortDefinition | undefined,
  enterPort: HeightDirectionPortDefinition | undefined
): exitPort is HeightDirectionPortDefinition {
  return !!exitPort && !!enterPort && exitPort.exitHeight === enterPort.enterHeight;
}

/**
 * Converts height cells into deterministic directed edges. Tests use this pure
 * helper so route fixtures exercise the same exact height-port rule as the scene graph builder.
 */
export function buildHeightNavigationEdges(cells: HeightNavigationCell[][]): Map<string, HeightNavigationEdge[]> {
  const edgesByTileKey = new Map<string, HeightNavigationEdge[]>();
  for (let y = 0; y < cells.length; y++) {
    for (let x = 0; x < cells[y]!.length; x++) {
      const cell = cells[y]![x]!;
      if (!cell.isNavigable) continue;
      const edges: HeightNavigationEdge[] = [];
      for (const direction of HEIGHT_NAVIGATION_DIRECTIONS) {
        const edge = getHeightNavigationEdge(cell, direction, cells);
        if (edge) edges.push(edge);
      }
      edgesByTileKey.set(toHeightNavigationTileKey(cell), edges);
    }
  }
  return edgesByTileKey;
}

export function toHeightNavigationTileKey(tile: Vector2Simple): string {
  return `${tile.x},${tile.y}`;
}

function getHeightNavigationEdge(
  from: HeightNavigationCell,
  direction: DirectionOffset,
  cells: HeightNavigationCell[][]
): HeightNavigationEdge | undefined {
  const to = cells[from.y + direction.dy]?.[from.x + direction.dx];
  if (!to?.isNavigable) return undefined;
  const exitPort = from.ports[direction.direction];
  const enterPort = to.ports[direction.opposite];
  if (!exitPort || !enterPort) return undefined;
  if (!canConnectHeightNavigationPorts(exitPort, enterPort)) return undefined;
  return {
    from: { x: from.x, y: from.y },
    to: { x: to.x, y: to.y },
    direction: direction.direction,
    exitHeight: exitPort.exitHeight,
    enterHeight: enterPort.enterHeight
  };
}

/**
 * Builds the static height-connected navigation graph. It owns only terrain and
 * navigable-object height edges; moving actors are overlaid later by movement occupancy.
 */
export class HeightNavigationGraphBuilder {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {}

  build(navigationGrid: number[][]): HeightNavigationGraph {
    const cells = this.createBaseCells(navigationGrid);
    this.applyNavigableSurfaces(cells);
    const edgesByTileKey = buildHeightNavigationEdges(cells);
    return { cells, edgesByTileKey };
  }

  private createBaseCells(navigationGrid: number[][]): HeightNavigationCell[][] {
    return navigationGrid.map((row, y) =>
      row.map((tile, x) => ({
        x,
        y,
        navigableHeight: 0,
        isNavigable: tile === 0,
        ports: tile === 0 ? this.createFlatPorts(0, 0) : {}
      }))
    );
  }

  private applyNavigableSurfaces(cells: HeightNavigationCell[][]): void {
    this.scene.children.each((child) => {
      const navigableComponent = getActorComponent(child, NavigableComponent);
      if (!navigableComponent) return;

      const tilesUnderObject = getTileCoordsUnderObject(this.tilemap, child);
      const { shrinkX, shrinkY } = NavigableComponent.handleNavigable(child);
      const surfaceTiles = this.shrinkTiles(tilesUnderObject, shrinkX, shrinkY);
      const def = navigableComponent.navigableDefinition;

      surfaceTiles.forEach(({ x, y }) => {
        const cell = cells[y]?.[x];
        if (!cell) return;
        cell.navigableHeight = def.navigableHeight ?? 0;
        cell.isNavigable = true;
        cell.navigableComponent = navigableComponent;
        cell.ports = this.createPortsForNavigable(navigableComponent);
      });
    });
  }

  private shrinkTiles(tiles: Vector2Simple[], shrinkX: number, shrinkY: number): Vector2Simple[] {
    if (tiles.length === 0) return tiles;
    const minX = Math.min(...tiles.map((tile) => tile.x));
    const maxX = Math.max(...tiles.map((tile) => tile.x));
    const minY = Math.min(...tiles.map((tile) => tile.y));
    const maxY = Math.max(...tiles.map((tile) => tile.y));
    return tiles.filter((tile) => {
      const isShrinkedX = tile.x >= minX + shrinkX && tile.x <= maxX - shrinkX;
      const isShrinkedY = tile.y >= minY + shrinkY && tile.y <= maxY - shrinkY;
      return isShrinkedX && isShrinkedY;
    });
  }

  private createPortsForNavigable(
    navigableComponent: NavigableComponent
  ): Partial<Record<NavigablePathDirection, HeightDirectionPortDefinition>> {
    const ports: Partial<Record<NavigablePathDirection, HeightDirectionPortDefinition>> = {};
    for (const { direction } of HEIGHT_NAVIGATION_DIRECTIONS) {
      const port = navigableComponent.getDirectionPort(direction as keyof NavigablePath);
      if (port) ports[direction] = port;
    }
    return ports;
  }

  private createFlatPorts(
    enterHeight: number,
    exitHeight: number
  ): Partial<Record<NavigablePathDirection, HeightDirectionPortDefinition>> {
    return Object.fromEntries(
      HEIGHT_NAVIGATION_DIRECTIONS.map(({ direction }) => [direction, { enterHeight, exitHeight }])
    ) as Partial<Record<NavigablePathDirection, HeightDirectionPortDefinition>>;
  }

}
