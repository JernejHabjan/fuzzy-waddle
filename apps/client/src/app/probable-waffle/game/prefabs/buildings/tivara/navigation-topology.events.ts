import type { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { onObjectReady } from "../../../data/game-object-helper";
import { getCenterTileCoordUnderObject } from "../../../library/tile-under-object";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { TilemapComponent } from "../../../world/tilemap/tilemap.component";

export const StructureTopologyChangedEvent = "structure-topology-changed";

export interface StructureTopologyChangedPayload {
  source: Phaser.GameObjects.GameObject;
  tile: Vector2Simple;
}

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
    onObjectReady(this.gameObject, this.handleReady, this);
  }

  notify(): void {
    emitStructureTopologyChanged(this.gameObject);
  }

  notifyIfVisibilityChanged(previousStates: boolean[], nextStates: boolean[]): void {
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
}
