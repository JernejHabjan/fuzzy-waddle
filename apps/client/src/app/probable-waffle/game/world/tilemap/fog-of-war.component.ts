import { NavigationService } from "../services/navigation.service";
import { throttle } from "../../library/throttle";
import { VisionComponent } from "../../entity/components/vision-component";
import { getActorComponent } from "../../data/actor-component";
import { getCurrentPlayerNumber } from "../../data/scene-data";
import { IdComponent } from "../../entity/components/id-component";
import { getGameObjectBounds, getGameObjectVisibility, getGameObjectCurrentTile } from "../../data/game-object-helper";
import { IsoHelper } from "./iso-helper";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { getSceneService } from "../services/scene-component-helpers";
import { ActorIndexSystem } from "../services/ActorIndexSystem";
import GameObject = Phaser.GameObjects.GameObject;

export enum FogOfWarMode {
  FULL_EXPLORATION = "fullExploration",
  PRE_EXPLORED = "preExplored",
  ALL_VISIBLE = "allVisible"
}

export class FogOfWarComponent {
  private fowMode: FogOfWarMode = FogOfWarMode.PRE_EXPLORED;
  private readonly fowLayer: Phaser.GameObjects.Graphics;
  private exploredTiles: Set<number> = new Set();
  private visibleTiles: Set<number> = new Set();
  private readonly tileWidth: number;
  private readonly tileHeight: number;
  private readonly gridWidth: number;
  private readonly gridHeight: number;
  private readonly startX: number;
  private readonly startY: number;
  private readonly margin: number = 40; // Margin for the fog of war grid
  private static depth: number = 10000000000; // High depth to ensure it's drawn above most game elements

  // Track actors with ID components for visibility management
  private playerActors: Map<string, GameObject> = new Map();

  // Cache for tile world positions to avoid repeated coordinate transformations
  private tileWorldPosCache: Map<number, { x: number; y: number }> = new Map();

  // Cache for vision tiles per object - key: "objectId:tileX,tileY:radius", value: Set<tileKey>
  private visionTilesCache: Map<string, Set<number>> = new Map();

  // Dirty tracking to avoid unnecessary actor rescanning
  private actorPositionCache: Map<string, { x: number; y: number }> = new Map();
  private dirtyActors: Set<string> = new Set(); // Actor IDs that moved or changed
  private needsFullActorScan: boolean = true; // Force full scan on first update

  // Track which tiles need to be redrawn (dirty tiles)
  private dirtyTiles: Set<number> = new Set();
  private previousVisibleTiles: Set<number> = new Set();
  private previousExploredTiles: Set<number> = new Set();

  private actorIndex!: ActorIndexSystem;

  // Colors for different FOW states
  private readonly COLOR_UNEXPLORED = 0x333333;
  private readonly COLOR_EXPLORED = 0x777777;
  private readonly ALPHA_UNEXPLORED_PE_EXPLORED_MODE = 0.7;
  private readonly ALPHA_UNEXPLORED_FULL_EXPLORATION_MODE = 1;
  private readonly ALPHA_EXPLORED = 0.5;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap
  ) {
    this.tileWidth = this.tilemap.tileWidth;
    this.tileHeight = this.tilemap.tileHeight;
    this.startX = -this.margin;
    this.startY = -this.margin;
    // Store the end coordinates for clarity
    this.gridWidth = this.tilemap.width + this.margin * 2;
    this.gridHeight = this.tilemap.height + this.margin * 2;

    // Create graphics layer for fog of war
    this.fowLayer = this.scene.add.graphics();
    this.fowLayer.setDepth(FogOfWarComponent.depth);

    // Pre-cache all tile world positions to avoid repeated coordinate transformations
    this.precacheTileWorldPositions();

    // Initialize actor tracking
    this.actorIndex = getSceneService(this.scene, ActorIndexSystem)!;
    this.scanForPlayerActors();

    // Subscribe to navigation updates
    this.scene.events.on(NavigationService.UpdateNavigationEvent, this.throttleUpdateFogOfWar, this); // todo this for some reason doesnt work - also it doesnt work in navigation.service.ts
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleUpdateFogOfWar, this); // todo this is very expensive
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    // Initial draw of fog
    this.drawInitialFog();
  }

  /**
   * Pre-cache tile world positions to avoid repeated tileToWorldXY calls
   */
  private precacheTileWorldPositions(): void {
    const endX = this.startX + this.gridWidth;
    const endY = this.startY + this.gridHeight;
    for (let y = this.startY; y < endY; y++) {
      for (let x = this.startX; x < endX; x++) {
        const tileKey = this.getTileKey(x, y);
        const worldPos = this.tilemap.tileToWorldXY(x, y);
        if (worldPos) {
          this.tileWorldPosCache.set(tileKey, { x: worldPos.x, y: worldPos.y });
        }
      }
    }
  }

  /**
   * Convert tile coordinates to a numeric key for efficient Set/Map operations
   * Using numeric keys is faster than string concatenation
   * Accounts for negative starting coordinates by offsetting to 0-based indexing
   */
  private getTileKey(x: number, y: number): number {
    const normalizedX = x - this.startX;
    const normalizedY = y - this.startY;
    return normalizedY * this.gridWidth + normalizedX;
  }

  private scanForPlayerActors(): void {
    // Use indexed id-actors instead of scanning all children
    this.playerActors.clear();
    const list = this.actorIndex.getAllIdActors();
    list.forEach(this.registerActors, this);
    this.needsFullActorScan = false;
  }

  /**
   * Smart actor scanning - only rescans when necessary (dirty tracking)
   * Much more efficient than full scan every frame
   */
  private updatePlayerActorsIfNeeded(): void {
    // Full scan needed on first update or when explicitly marked dirty
    if (this.needsFullActorScan) {
      this.scanForPlayerActors();
      return;
    }

    // Otherwise, only check for new/removed actors (much cheaper)
    const currentActors = this.actorIndex.getAllIdActors();
    const currentActorIds = new Set<string>();

    // Quick pass: identify new actors and mark moved actors as dirty
    for (const actor of currentActors) {
      const idComponent = getActorComponent(actor, IdComponent);
      const resourceSourceComponent = getActorComponent(actor, ResourceSourceComponent);

      if (idComponent && !resourceSourceComponent) {
        const id = idComponent.id;
        if (!id) continue;

        currentActorIds.add(id);

        // Check if this is a new actor
        if (!this.playerActors.has(id)) {
          this.playerActors.set(id, actor);
          this.dirtyActors.add(id);
        } else {
          // Check if actor moved (only for actors with vision)
          const visionComponent = getActorComponent(actor, VisionComponent);
          if (visionComponent && visionComponent.range > 0) {
            const currentTile = getGameObjectCurrentTile(actor);
            if (currentTile) {
              const cachedPos = this.actorPositionCache.get(id);
              if (!cachedPos || cachedPos.x !== currentTile.x || cachedPos.y !== currentTile.y) {
                // Actor moved - mark as dirty
                this.dirtyActors.add(id);
                this.actorPositionCache.set(id, { x: currentTile.x, y: currentTile.y });
              }
            }
          }
        }
      }
    }

    // Remove actors that no longer exist
    for (const [id, actor] of this.playerActors) {
      if (!currentActorIds.has(id) || !actor.active) {
        this.playerActors.delete(id);
        this.actorPositionCache.delete(id);
        this.dirtyActors.add(id); // Mark as dirty to recalculate vision
      }
    }
  }

  /**
   * Marks all actors as dirty, forcing vision recalculation
   */
  public markAllActorsDirty(): void {
    this.dirtyActors.clear();
    for (const id of this.playerActors.keys()) {
      this.dirtyActors.add(id);
    }
  }

  /**
   * Forces a full actor rescan on next update
   */
  public markNeedsFullScan(): void {
    this.needsFullActorScan = true;
  }

  private registerActors(obj: GameObject): void {
    const idComponent = getActorComponent(obj, IdComponent);
    const resourceSourceComponent = getActorComponent(obj, ResourceSourceComponent);

    if (idComponent && !resourceSourceComponent) {
      const id = idComponent.id;
      if (id && !this.playerActors.has(id)) {
        this.playerActors.set(id, obj);
      }
    }
  }

  public setMode(mode: FogOfWarMode): void {
    this.fowMode = mode;
    this.updateFogOfWar();
  }

  public getMode(): FogOfWarMode {
    return this.fowMode;
  }

  private drawInitialFog(): void {
    this.redrawFogOfWar();
  }

  private throttleUpdateFogOfWar = throttle(this.updateFogOfWar.bind(this), 100);

  public updateFogOfWar(): void {
    // Store previous state for dirty tile tracking
    this.previousVisibleTiles = new Set(this.visibleTiles);
    this.previousExploredTiles = new Set(this.exploredTiles);

    // Clear previous visible tiles
    this.visibleTiles.clear();

    // Smart actor scanning - only rescans when needed (new/removed/moved actors)
    this.updatePlayerActorsIfNeeded();

    // Get player-owned game objects with vision
    const playerOwnedObjects: GameObject[] = [];
    const currentPlayerNumber = getCurrentPlayerNumber(this.scene);

    if (currentPlayerNumber !== undefined) {
      const index = this.actorIndex;
      const owned = index ? index.getOwnedActors(currentPlayerNumber) : [];
      owned.forEach((child) => {
        const healthComponent = getActorComponent(child, HealthComponent);
        if (healthComponent && healthComponent.killed) return; // Skip dead actors
        playerOwnedObjects.push(child);
      });
    }

    // Calculate visible tiles for all player-owned objects
    // Group objects by vision radius for better cache efficiency
    const objectsByRadius = new Map<number, Array<{ obj: GameObject; tilePos: { x: number; y: number } }>>();

    for (const obj of playerOwnedObjects) {
      const visionComponent = getActorComponent(obj, VisionComponent);
      if (!visionComponent) continue;

      const radius = visionComponent.range;
      if (radius <= 0) continue; // Skip objects with no vision

      // Get object's tile position early to avoid repeated calls
      const tilePos = getGameObjectCurrentTile(obj);
      if (!tilePos) continue;

      const group = objectsByRadius.get(radius) || [];
      group.push({ obj, tilePos });
      objectsByRadius.set(radius, group);
    }

    // Process objects grouped by radius
    for (const [radius, objects] of objectsByRadius) {
      for (const { obj, tilePos } of objects) {
        const idComponent = getActorComponent(obj, IdComponent);
        const cacheKey = idComponent?.id
          ? `${idComponent.id}:${tilePos.x},${tilePos.y}:${radius}`
          : `${tilePos.x},${tilePos.y}:${radius}`;

        // Check cache first
        let visionTiles = this.visionTilesCache.get(cacheKey);

        if (!visionTiles) {
          // Calculate tiles in vision radius using optimized circle algorithm
          visionTiles = new Set<number>();

          // Use Bresenham circle for edge tiles, then fill
          const radiusSq = radius * radius;
          for (let dx = -radius; dx <= radius; dx++) {
            const dxSq = dx * dx;
            for (let dy = -radius; dy <= radius; dy++) {
              const distSq = dxSq + dy * dy;
              if (distSq <= radiusSq) {
                const x = tilePos.x + dx;
                const y = tilePos.y + dy;
                // New guard to avoid generating tile keys for out-of-range coordinates
                if (x < 0 || y < 0) {
                  continue;
                }
                const tileKey = this.getTileKey(x, y);
                visionTiles.add(tileKey);
              }
            }
          }

          // Cache the result
          this.visionTilesCache.set(cacheKey, visionTiles);

          // Limit cache size to prevent memory issues
          if (this.visionTilesCache.size > 500) {
            // Remove oldest entries (first entries in the map)
            const keysToDelete = Array.from(this.visionTilesCache.keys()).slice(0, 100);
            keysToDelete.forEach(key => this.visionTilesCache.delete(key));
          }
        }

        // Add cached tiles to visible and explored
        visionTiles.forEach((tileKey) => {
          this.visibleTiles.add(tileKey);
          this.exploredTiles.add(tileKey);
        });
      }
    }

    // Clear dirty actors set after processing
    // NOTE: dirtyActors is intentionally not cleared here anymore because it is not used by updateFogOfWar();
    // clearing it would add overhead without affecting current fog-of-war behavior.

    // Calculate dirty tiles (tiles that changed state)
    this.calculateDirtyTiles();

    // Update actor visibility based on fog of war
    this.updateActorsVisibility();

    // Redraw only changed fog-of-war tiles
    this.redrawFogOfWar();
  }

  /**
   * Calculate which tiles need to be redrawn based on visibility changes
   */
  private calculateDirtyTiles(): void {
    this.dirtyTiles.clear();

    // Find tiles that changed visibility state
    this.visibleTiles.forEach((tileKey) => {
      if (!this.previousVisibleTiles.has(tileKey)) {
        this.dirtyTiles.add(tileKey);
      }
    });

    this.previousVisibleTiles.forEach((tileKey) => {
      if (!this.visibleTiles.has(tileKey)) {
        this.dirtyTiles.add(tileKey);
      }
    });

    // Find tiles that changed explored state
    this.exploredTiles.forEach((tileKey) => {
      if (!this.previousExploredTiles.has(tileKey)) {
        this.dirtyTiles.add(tileKey);
      }
    });
  }

  /**
   * Updates the visibility of actors with IdComponent based on fog of war
   */
  private updateActorsVisibility(): void {
    this.playerActors.forEach((actor, id) => {
      // Skip if actor is no longer valid
      if (!actor.active || !actor.scene) {
        this.playerActors.delete(id);
        return;
      }

      if (this.fowMode === FogOfWarMode.ALL_VISIBLE) {
        this.setActorVisibleByFow(actor, true);
        return;
      }

      // Check if actor should be visible
      const bounds = getGameObjectBounds(actor);
      if (!bounds) return;

      // Get tile position from the center of the actor
      const centerX = bounds.centerX;
      const centerY = bounds.centerY;

      const tilePos = IsoHelper.isometricWorldToTileXY(this.scene, centerX, centerY, false);

      if (!tilePos) return;

      const tileKey = this.getTileKey(tilePos.x, tilePos.y);
      const isVisible = this.visibleTiles.has(tileKey);

      this.setActorVisibleByFow(actor, isVisible);
    });
  }

  private setActorVisibleByFow(actor: GameObject, visible: boolean): void {
    const visionComponent = getActorComponent(actor, VisionComponent);
    if (!visionComponent) return;
    visionComponent.visibilityByCurrentPlayer = visible;
    const visibilityComponent = getGameObjectVisibility(actor);
    if (!visibilityComponent) return;

    const healthComponent = getActorComponent(actor, HealthComponent);
    if (healthComponent && healthComponent.hidden) {
      visible = false;
    }
    visibilityComponent.setVisible(visible);
  }

  /**
   * Draws an isometric diamond shape at the specified world coordinates
   */
  private drawIsometricTile(x: number, y: number, width: number, height: number, color: number, alpha: number): void {
    this.fowLayer.fillStyle(color, alpha);

    // Calculate the four points of the diamond
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Draw diamond shape
    this.fowLayer.beginPath();
    this.fowLayer.moveTo(x + halfWidth, y); // Top point
    this.fowLayer.lineTo(x + width, y + halfHeight); // Right point
    this.fowLayer.lineTo(x + halfWidth, y + height); // Bottom point
    this.fowLayer.lineTo(x, y + halfHeight); // Left point
    this.fowLayer.closePath();
    this.fowLayer.fillPath();
  }

  private redrawFogOfWar(): void {
    // NOTE: We intentionally do not early-return when dirtyTiles is empty, to ensure
    // required redraws on initialization and when the fog-of-war mode changes.
    let alphaUnexplored = 0;
    switch (this.fowMode) {
      case FogOfWarMode.FULL_EXPLORATION:
        alphaUnexplored = this.ALPHA_UNEXPLORED_FULL_EXPLORATION_MODE;
        break;
      case FogOfWarMode.PRE_EXPLORED:
        alphaUnexplored = this.ALPHA_UNEXPLORED_PE_EXPLORED_MODE;
        break;
      case FogOfWarMode.ALL_VISIBLE:
        // Clear all fog and return
        this.fowLayer.clear();
        return;
    }

    // Full redraw: clear everything and redraw all tiles
    // Note: Due to overlapping isometric tiles, we always do a full clear and redraw
    // The performance gain comes from the early exit above when there are no dirty tiles
    this.fowLayer.clear();

    const endX = this.startX + this.gridWidth;
    const endY = this.startY + this.gridHeight;
    for (let y = this.startY; y < endY; y++) {
      for (let x = this.startX; x < endX; x++) {
        const tileKey = this.getTileKey(x, y);
        const worldPos = this.tileWorldPosCache.get(tileKey);

        if (worldPos) {
          this.drawTileAtWorldPos(worldPos.x, worldPos.y, tileKey, alphaUnexplored);
        }
      }
    }

    // Clear dirty tiles set after redraw
    this.dirtyTiles.clear();
  }

  /**
   * Draw a single tile at the given world position
   */
  private drawTileAtWorldPos(worldX: number, worldY: number, tileKey: number, alphaUnexplored: number): void {
    if (this.visibleTiles.has(tileKey)) {
      // Currently visible - no fog
    } else if (this.exploredTiles.has(tileKey)) {
      // Explored but not currently visible
      this.drawIsometricTile(worldX, worldY, this.tileWidth, this.tileHeight, this.COLOR_EXPLORED, this.ALPHA_EXPLORED);
    } else {
      // Unexplored
      this.drawIsometricTile(
        worldX,
        worldY,
        this.tileWidth,
        this.tileHeight,
        this.COLOR_UNEXPLORED,
        alphaUnexplored
      );
    }
  }

  public getTileVisibility(x: number, y: number): "visible" | "explored" | "unexplored" {
    const tileKey = this.getTileKey(x, y);

    if (this.visibleTiles.has(tileKey)) {
      return "visible";
    } else if (this.exploredTiles.has(tileKey)) {
      return "explored";
    } else {
      return "unexplored";
    }
  }

  public resetFogOfWar(): void {
    this.exploredTiles.clear();
    this.visibleTiles.clear();
    this.visionTilesCache.clear();
    this.actorPositionCache.clear();
    this.dirtyActors.clear();
    this.needsFullActorScan = true;
    this.drawInitialFog();
  }

  public revealEntireMap(): void {
    this.setMode(FogOfWarMode.ALL_VISIBLE);
    this.updateFogOfWar();
  }

  /**
   * Clear the vision tiles cache (useful when objects move significantly or are destroyed)
   */
  public clearVisionCache(): void {
    this.visionTilesCache.clear();
  }

  private destroy(): void {
    this.scene?.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateFogOfWar, this);
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.throttleUpdateFogOfWar, this);

    // Clear all caches
    this.visionTilesCache.clear();
    this.tileWorldPosCache.clear();
    this.playerActors.clear();
    this.actorPositionCache.clear();
    this.dirtyActors.clear();

    if (this.fowLayer) {
      this.fowLayer.destroy();
    }
  }
}
