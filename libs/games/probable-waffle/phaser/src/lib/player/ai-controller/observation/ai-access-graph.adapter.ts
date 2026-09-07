import type Phaser from "phaser";
import {
  buildAiAccessGraphV1,
  type AiAccessGraphV1,
  type AiAccessNodeId,
  type AiDomainV1,
  type BuiltAiAccessGraphV1
} from "@fuzzy-waddle/probable-waffle-gameplay";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { NavigationService } from "../../../world/services/navigation.service";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";
import { getSceneService } from "../../../world/services/scene-component-helpers";

/**
 * Caches a pure region graph per navigation revision. Actor-to-region lookup stays
 * runtime-local so observations contain stable regions rather than every map tile.
 */
export class AiAccessGraphAdapter {
  private static readonly CELL_BUDGET_PER_OBSERVATION = 512;
  private cachedRevision = -1;
  private cached?: BuiltAiAccessGraphV1;
  private pendingRevision = -1;
  private pendingCursor = 0;
  private pendingCells: Parameters<typeof buildAiAccessGraphV1>[0]["cells"][number][] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  advanceGraph(
    tick: number,
    threatRevision: number,
    permittedTopology: {
      readonly revision: number;
      readonly blockedTileKeys: ReadonlySet<string>;
      readonly navigableTileKeys: ReadonlySet<string>;
    }
  ): AiAccessGraphV1 | undefined {
    const navigation = getSceneService(this.scene, NavigationService);
    const tilemap = getSceneService(this.scene, TilemapComponent)?.tilemap;
    if (!navigation || !tilemap) return undefined;
    const revision = permittedTopology.revision;
    if (revision === this.cachedRevision && this.pendingRevision === -1 && this.cached) {
      if (this.cached.graph.threatRevision !== threatRevision) {
        this.cached = { ...this.cached, graph: { ...this.cached.graph, threatRevision, builtTick: tick } };
      }
      return this.cached.graph;
    }
    if (this.pendingRevision !== revision) {
      this.pendingRevision = revision;
      this.pendingCursor = 0;
      this.pendingCells = [];
    }
    const totalCells = tilemap.width * tilemap.height;
    const end = Math.min(totalCells, this.pendingCursor + AiAccessGraphAdapter.CELL_BUDGET_PER_OBSERVATION);
    for (let index = this.pendingCursor; index < end; index += 1) {
      const y = Math.floor(index / tilemap.width);
      const x = index % tilemap.width;
      this.pendingCells.push(this.captureCell(navigation, x, y, permittedTopology));
    }
    this.pendingCursor = end;
    if (this.pendingCursor >= totalCells) {
      this.cached = buildAiAccessGraphV1({
        generation: revision,
        staticRevision: 1,
        dynamicRevision: revision,
        threatRevision,
        builtTick: tick,
        continuationCursor: 0,
        includeAirRegion: true,
        cells: this.pendingCells
      });
      this.cachedRevision = revision;
      this.pendingRevision = -1;
      this.pendingCursor = 0;
      this.pendingCells = [];
      return this.cached.graph;
    }
    return this.cached
      ? { ...this.cached.graph, status: "pending", continuationCursor: this.pendingCursor, threatRevision }
      : undefined;
  }

  resolveNodeId(
    tile: Vector2Simple | undefined,
    domains: readonly AiDomainV1[]
  ): AiAccessNodeId | undefined {
    if (!tile) return undefined;
    const built = this.cached;
    if (!built) return undefined;
    if (domains.includes("air") && built.airNodeId) return built.airNodeId;
    const key = `${tile.x},${tile.y}`;
    if (domains.includes("water")) {
      const water = built.waterNodeByTileKey.get(key);
      if (water) return water;
    }
    const directGround = built.groundNodeByTileKey.get(key);
    if (directGround) return directGround;
    // Static buildings often occupy a blocked center tile. Resolve their firing/
    // service region from the closest legal adjacent ground tile deterministically.
    const candidates: { nodeId: AiAccessNodeId; distance: number; x: number; y: number }[] = [];
    for (let radius = 1; radius <= 6; radius += 1) {
      for (let y = tile.y - radius; y <= tile.y + radius; y += 1) {
        for (let x = tile.x - radius; x <= tile.x + radius; x += 1) {
          const nodeId = built.groundNodeByTileKey.get(`${x},${y}`);
          if (!nodeId) continue;
          candidates.push({ nodeId, distance: Math.abs(x - tile.x) + Math.abs(y - tile.y), x, y });
        }
      }
      if (candidates.length) break;
    }
    return candidates.sort(
      (left, right) => left.distance - right.distance || left.y - right.y || left.x - right.x || left.nodeId.localeCompare(right.nodeId)
    )[0]?.nodeId;
  }

  private captureCell(
    navigation: NavigationService,
    x: number,
    y: number,
    permittedTopology: {
      readonly blockedTileKeys: ReadonlySet<string>;
      readonly navigableTileKeys: ReadonlySet<string>;
    }
  ) {
    const heightGraph = navigation.getHeightGraphDebugSnapshot();
    const tile = { x, y };
    const baseGround = navigation.isTileGridWithoutBlockingObjectsNavigable(tile);
    const tileKey = `${x},${y}`;
    const observedBlocked = permittedTopology.blockedTileKeys.has(tileKey);
    const observedNavigable = permittedTopology.navigableTileKeys.has(tileKey);
    // The runtime height graph includes all actors. Read its cells only where
    // the observation policy admitted the owning navigable surface.
    const heightCell = observedNavigable ? heightGraph?.cells[y]?.[x] : undefined;
    const edges = observedNavigable ? heightGraph?.edgesByTileKey.get(tileKey) ?? [] : [];
    const groundAt = (candidateX: number, candidateY: number) => {
      const candidateKey = `${candidateX},${candidateY}`;
      const navigable = permittedTopology.navigableTileKeys.has(candidateKey);
      const blocked = permittedTopology.blockedTileKeys.has(candidateKey) && !navigable;
      return !blocked && (navigable || navigation.isTileGridWithoutBlockingObjectsNavigable({ x: candidateX, y: candidateY }));
    };
    let clearance = 1;
    for (let side = 2; side <= 4; side += 1) {
      const minimum = -Math.floor((side - 1) / 2);
      const maximum = minimum + side - 1;
      let fits = true;
      for (let offsetY = minimum; offsetY <= maximum && fits; offsetY += 1) {
        for (let offsetX = minimum; offsetX <= maximum; offsetX += 1) {
          if (!groundAt(x + offsetX, y + offsetY)) {
            fits = false;
            break;
          }
        }
      }
      if (!fits) break;
      clearance = side;
    }
    let waterClearance = 1;
    for (let side = 2; side <= 4; side += 1) {
      const minimum = -Math.floor((side - 1) / 2);
      const maximum = minimum + side - 1;
      let fits = true;
      for (let offsetY = minimum; offsetY <= maximum && fits; offsetY += 1) {
        for (let offsetX = minimum; offsetX <= maximum; offsetX += 1) {
          if (!navigation.isTileNavigable({ x: x + offsetX, y: y + offsetY }, MovementTerrainType.Water)) {
            fits = false;
            break;
          }
        }
      }
      if (!fits) break;
      waterClearance = side;
    }
    const adjacentGroundKeys = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const neighbor = { x: x + dx, y: y + dy };
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        const neighborNavigable = permittedTopology.navigableTileKeys.has(neighborKey);
        const neighborBlocked = permittedTopology.blockedTileKeys.has(neighborKey) && !neighborNavigable;
        if (
          neighborBlocked ||
          (!neighborNavigable && !navigation.isTileGridWithoutBlockingObjectsNavigable(neighbor))
        ) continue;
        const explicitEdge = edges.some((edge) => edge.to.x === neighbor.x && edge.to.y === neighbor.y);
        const sameHeight = navigation.getNavigableHeightAtTile(neighbor) === (heightCell?.navigableHeight ?? 0);
        if (explicitEdge || sameHeight) adjacentGroundKeys.push(`${neighbor.x},${neighbor.y}`);
      }
    }
    return {
      x,
      y,
      // Base terrain is player-independent. Observed blockers remain a
      // separate map revision/product and cannot leak hidden actor layout.
      ground: observedNavigable || (baseGround && !observedBlocked),
      water: navigation.isTileNavigable(tile, MovementTerrainType.Water),
      elevation: heightCell?.navigableHeight ?? 0,
      groundNeighborKeys: adjacentGroundKeys.sort(),
      knowledge: observedBlocked || observedNavigable ? "observed_dynamic" as const : "known_static" as const,
      clearance,
      waterClearance
    };
  }
}
