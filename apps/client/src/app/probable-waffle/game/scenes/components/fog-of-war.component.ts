import { getTilesAroundGameObjectsOfShape } from "../../data/tile-map-helpers";
import { NavigationService } from "../services/navigation.service";
import { OwnerComponent } from "../../entity/actor/components/owner-component";
import { throttle } from "../../library/throttle";
import { VisionComponent } from "../../entity/actor/components/vision-component";
import { getActorComponent } from "../../data/actor-component";
import { getCurrentPlayerNumber } from "../../data/scene-data";
import GameObject = Phaser.GameObjects.GameObject;

export enum FogOfWarMode {
  FULL_EXPLORATION = "fullExploration",
  PRE_EXPLORED = "preExplored"
}

export class FogOfWarComponent {
  private fowMode: FogOfWarMode = FogOfWarMode.PRE_EXPLORED;
  private readonly fowLayer: Phaser.GameObjects.Graphics;
  private exploredTiles: Set<string> = new Set();
  private visibleTiles: Set<string> = new Set();
  private readonly tileWidth: number;
  private readonly tileHeight: number;
  private readonly gridWidth: number;
  private readonly gridHeight: number;
  private readonly startX: number;
  private readonly startY: number;
  private readonly margin: number = 20; // Margin for the fog of war grid

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
    this.fowLayer.setDepth(10000000000); // High depth to ensure it's drawn above most game elements // TODO HARDCODE

    // Subscribe to navigation updates
    this.scene.events.on(NavigationService.UpdateNavigationEvent, this.throttleUpdateFogOfWar, this); // todo this for some reason doesnt work - also it doesnt work in navigation.service.ts
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.throttleUpdateFogOfWar, this); // todo this is very expensive
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    // Initial draw of fog
    this.drawInitialFog();
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
    // Clear previous visible tiles
    this.visibleTiles.clear();

    // Get player-owned game objects with vision
    const playerOwnedObjects: GameObject[] = [];
    this.scene.children.getChildren().forEach((child) => {
      const ownerComponent = getActorComponent(child, OwnerComponent);

      if (ownerComponent) {
        const owner = ownerComponent.getOwner();
        if (!owner) return;
        const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
        if (currentPlayerNumber === undefined) return;
        if (owner === currentPlayerNumber) {
          playerOwnedObjects.push(child);
        }
      }
    });

    // Calculate visible tiles for all player-owned objects
    playerOwnedObjects.forEach((obj) => {
      const visionComponent = getActorComponent(obj, VisionComponent);
      if (visionComponent) {
        const radius = visionComponent.range;
        const visibleTilesForObj = getTilesAroundGameObjectsOfShape(obj, this.scene, radius, "circle");

        // Add to visible and explored tiles
        visibleTilesForObj.forEach((tile) => {
          const tileKey = `${tile.x},${tile.y}`;
          this.visibleTiles.add(tileKey);
          this.exploredTiles.add(tileKey);
        });
      }
    });

    // Redraw fog-of-war
    this.redrawFogOfWar();
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
    this.fowLayer.clear();

    const alphaUnexplored =
      this.fowMode === FogOfWarMode.FULL_EXPLORATION
        ? this.ALPHA_UNEXPLORED_FULL_EXPLORATION_MODE
        : this.ALPHA_UNEXPLORED_PE_EXPLORED_MODE;

    // Draw fog for the entire map
    for (let y = this.startY; y < this.gridHeight; y++) {
      for (let x = this.startX; x < this.gridWidth; x++) {
        const tileKey = `${x},${y}`;
        const worldPos = this.tilemap.tileToWorldXY(x, y);

        if (worldPos) {
          if (this.visibleTiles.has(tileKey)) {
            // Currently visible - no fog
          } else if (this.exploredTiles.has(tileKey)) {
            // Explored but not currently visible
            this.drawIsometricTile(
              worldPos.x,
              worldPos.y,
              this.tileWidth,
              this.tileHeight,
              this.COLOR_EXPLORED,
              this.ALPHA_EXPLORED
            );
          } else {
            // Unexplored
            this.drawIsometricTile(
              worldPos.x,
              worldPos.y,
              this.tileWidth,
              this.tileHeight,
              this.COLOR_UNEXPLORED,
              alphaUnexplored
            );
          }
        }
      }
    }
  }

  public getTileVisibility(x: number, y: number): "visible" | "explored" | "unexplored" {
    const tileKey = `${x},${y}`;

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
    for (let y = this.startY; y < this.gridHeight; y++) {
      for (let x = this.startX; x < this.gridWidth; x++) {
        this.exploredTiles.add(`${x},${y}`);
      }
    }
    this.updateFogOfWar();
  }

  private destroy(): void {
    this.scene.events.off(NavigationService.UpdateNavigationEvent, this.throttleUpdateFogOfWar, this);

    if (this.fowLayer) {
      this.fowLayer.destroy();
    }
  }
}
