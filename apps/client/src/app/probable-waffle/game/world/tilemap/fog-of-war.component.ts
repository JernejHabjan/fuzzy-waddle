import { getTilesAroundGameObjectsOfShape } from "../../data/tile-map-helpers";
import { NavigationService } from "../services/navigation.service";
import { throttle } from "../../library/throttle";
import { VisionComponent } from "../../entity/components/vision-component";
import { getActorComponent } from "../../data/actor-component";
import { getCurrentPlayerNumber } from "../../data/scene-data";
import { IdComponent } from "../../entity/components/id-component";
import { getGameObjectBounds, getGameObjectVisibility } from "../../data/game-object-helper";
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
    this.gridWidth = this.tilemap.width + this.margin;
    this.gridHeight = this.tilemap.height + this.margin;

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
    for (let y = this.startY; y < this.gridHeight; y++) {
      for (let x = this.startX; x < this.gridWidth; x++) {
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
   */
  private getTileKey(x: number, y: number): number {
    return y * this.gridWidth + x;
  }

  private scanForPlayerActors(): void {
    // Use indexed id-actors instead of scanning all children
    this.playerActors.clear();
    const list = this.actorIndex.getAllIdActors();
    list.forEach(this.registerActors, this);
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

    // Scan for any new actors with IdComponent
    this.scanForPlayerActors();

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
    playerOwnedObjects.forEach((obj) => {
      const visionComponent = getActorComponent(obj, VisionComponent);
      if (visionComponent) {
        const radius = visionComponent.range;
        const { tilesWithOutBounds } = getTilesAroundGameObjectsOfShape(obj, this.scene, radius, "circle");

        // Add to visible and explored tiles
        tilesWithOutBounds.forEach((tile) => {
          const tileKey = this.getTileKey(tile.x, tile.y);
          this.visibleTiles.add(tileKey);
          this.exploredTiles.add(tileKey);
        });
      }
    });

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
    // Only clear and redraw if there are dirty tiles or if mode changed
    if (this.dirtyTiles.size === 0 && this.fowMode !== FogOfWarMode.ALL_VISIBLE) {
      return;
    }

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

    // If we have many dirty tiles (> 30% of map), do a full redraw
    // Otherwise, redraw only dirty tiles
    const totalTiles = this.gridWidth * this.gridHeight;
    const shouldFullRedraw = this.dirtyTiles.size > totalTiles * 0.3;

    if (shouldFullRedraw) {
      // Full redraw: clear everything and redraw all tiles
      this.fowLayer.clear();

      for (let y = this.startY; y < this.gridHeight; y++) {
        for (let x = this.startX; x < this.gridWidth; x++) {
          const tileKey = this.getTileKey(x, y);
          const worldPos = this.tileWorldPosCache.get(tileKey);

          if (worldPos) {
            this.drawTileAtWorldPos(worldPos.x, worldPos.y, tileKey, alphaUnexplored);
          }
        }
      }
    } else {
      // Incremental redraw: only redraw dirty tiles
      // Note: We need to clear each dirty tile area first, then redraw
      this.dirtyTiles.forEach((tileKey) => {
        const worldPos = this.tileWorldPosCache.get(tileKey);
        if (worldPos) {
          // Clear the tile area by drawing it with alpha 0
          this.fowLayer.fillStyle(0x000000, 0);
          const halfWidth = this.tileWidth / 2;
          const halfHeight = this.tileHeight / 2;
          this.fowLayer.fillRect(worldPos.x - halfWidth, worldPos.y - halfHeight, this.tileWidth, this.tileHeight);

          // Redraw the tile with proper state
          this.drawTileAtWorldPos(worldPos.x, worldPos.y, tileKey, alphaUnexplored);
        }
      });
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
    this.drawInitialFog();
  }

  public revealEntireMap(): void {
    this.setMode(FogOfWarMode.ALL_VISIBLE);
    this.updateFogOfWar();
  }

  private destroy(): void {
    this.scene?.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateFogOfWar, this);
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.throttleUpdateFogOfWar, this);

    if (this.fowLayer) {
      this.fowLayer.destroy();
    }
  }
}
