import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { onObjectReady } from "../../../data/game-object-helper";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { getCenterTileCoordUnderObject } from "../../../library/tile-under-object";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";

export const StructureTopologyChangedEvent = "structure-topology-changed";

export interface StructureTopologyChangedPayload {
  source: Phaser.GameObjects.GameObject;
  tile: Vector2Simple;
}

/**
 * Emits a topology refresh anchored to the structure's logical center tile.
 * Neighbor-driven wall/stairs recomputes use tile adjacency only.
 */
export function emitStructureTopologyChanged(gameObject: Phaser.GameObjects.GameObject): void {
  const tilemap = getSceneComponent(gameObject.scene, TilemapComponent)?.tilemap;
  if (!tilemap) return;
  const tile = getCenterTileCoordUnderObject(tilemap, gameObject);
  if (!tile) return;
  gameObject.scene.events.emit(StructureTopologyChangedEvent, {
    source: gameObject,
    tile
  } satisfies StructureTopologyChangedPayload);
}

export function emitStructureTopologyChangedAtTile(
  gameObject: Phaser.GameObjects.GameObject,
  tile: Vector2Simple
): void {
  gameObject.scene.events.emit(StructureTopologyChangedEvent, {
    source: gameObject,
    tile
  } satisfies StructureTopologyChangedPayload);
}

/**
 * Returns true when a topology event originated from one of the 8 neighboring
 * tiles around the given structure.
 */
export function isStructureTopologyChangeAdjacent(
  gameObject: Phaser.GameObjects.GameObject,
  payload: StructureTopologyChangedPayload
): boolean {
  if (payload.source === gameObject) return false;
  const tilemap = getSceneComponent(gameObject.scene, TilemapComponent)?.tilemap;
  if (!tilemap) return false;
  const ownTile = getCenterTileCoordUnderObject(tilemap, gameObject);
  if (!ownTile) return false;
  return Math.abs(ownTile.x - payload.tile.x) <= 1 && Math.abs(ownTile.y - payload.tile.y) <= 1;
}

/**
 * Shared lifecycle for structures whose appearance or neighbors affect local
 * wall/stairs topology. It delays the first refresh one tick so adjacent
 * prefabs exist before the first recompute, and it only reacts to adjacent
 * topology events when a callback is provided.
 */
export class StructureTopologyService {
  private initialRefreshTimer?: Phaser.Time.TimerEvent;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly options: {
      onInitialRefresh?: () => void;
      onAdjacentTopologyChanged?: () => void;
    }
  ) {}

  init(): void {
    this.gameObject.once(HealthComponent.KilledEvent, this.handleKilled, this);
    onObjectReady(this.gameObject, this.handleReady, this);
  }

  notify(): void {
    emitStructureTopologyChanged(this.gameObject);
  }

  notifyIfVisibilityChanged(previousStates: boolean[], nextStates: boolean[]): void {
    // Construction previews and finished structures can expose different
    // geometry; only wake neighbors when that visible topology actually changed.
    if (previousStates.length !== nextStates.length) {
      this.notify();
      return;
    }
    for (let index = 0; index < previousStates.length; index++) {
      if (previousStates[index] !== nextStates[index]) {
        this.notify();
        return;
      }
    }
  }

  destroy(): void {
    this.gameObject.off(HealthComponent.KilledEvent, this.handleKilled, this);
    this.gameObject.scene?.events.off(StructureTopologyChangedEvent, this.handleStructureTopologyChanged, this);
    this.initialRefreshTimer?.destroy();
    this.notify();
  }

  private handleReady(): void {
    if (this.options.onAdjacentTopologyChanged) {
      this.gameObject.scene.events.on(StructureTopologyChangedEvent, this.handleStructureTopologyChanged, this);
    }
    this.initialRefreshTimer?.destroy();
    this.initialRefreshTimer = this.gameObject.scene.time.delayedCall(0, this.handleInitialRefresh, undefined, this);
  }

  private handleInitialRefresh(): void {
    if (!this.gameObject.active) return;
    this.options.onInitialRefresh?.();
    this.notify();
  }

  private handleStructureTopologyChanged(payload: StructureTopologyChangedPayload): void {
    if (!this.gameObject.active || !this.options.onAdjacentTopologyChanged) return;
    if (!isStructureTopologyChangeAdjacent(this.gameObject, payload)) return;
    this.options.onAdjacentTopologyChanged();
  }

  private handleKilled(): void {
    // Neighbor prefab selection ignores killed structures, so adjacent walls
    // and stairs need the same topology refresh they get when an object is removed.
    this.notify();
  }
}
