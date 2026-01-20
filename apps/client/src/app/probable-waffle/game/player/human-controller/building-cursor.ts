import { GameObjects, Input } from "phaser";
import {
  type ActorDefinition,
  ObjectNames,
  ResourceType,
  type Vector2Simple,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../data/actor-manager";
import { getGameObjectBounds, getGameObjectLogicalTransform, onSceneInitialized } from "../../data/game-object-helper";
import { DepthHelper } from "../../world/services/depth.helper";
import { pwActorDefinitions } from "../../prefabs/definitions/actor-definitions";
import { upgradeFromCoreToConstructingActorData } from "../../data/actor-data";
import { emitEventIssueActorCommandToSelectedActors, getCurrentPlayerNumber } from "../../data/scene-data";
import { EventEmitter } from "@angular/core";
import GameProbableWaffleScene from "../../world/scenes/GameProbableWaffleScene";
import { Subscription } from "rxjs";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";
import { getActorComponent } from "../../data/actor-component";
import { ConstructionGameObjectInterfaceComponent } from "../../entity/components/construction/construction-game-object-interface-component";
import { IdComponent } from "../../entity/components/id-component";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { NavigationService } from "../../world/services/navigation.service";
import { AudioService } from "../../world/services/audio.service";
import { UiFeedbackBuildDeniedSound } from "../../hud/UiFeedbackSfx";
import { FogOfWarComponent } from "../../world/tilemap/fog-of-war.component";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { ProductionValidator } from "../../data/tech-tree/production-validator";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getCostForObjectName } from "../../entity/components/production/cost-utils";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import Vector2 = Phaser.Math.Vector2;
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";

export class BuildingCursor {
  placementGrid?: GameObjects.Graphics;
  private building?: GameObjects.GameObject;
  private pointerLocation?: Vector2Simple;
  private attackRangeCircle?: GameObjects.Graphics;
  startPlacingBuilding = new EventEmitter<ObjectNames>();
  stopPlacingBuilding = new EventEmitter<void>();

  private readonly tileSize = TilemapComponent.tileWidth;
  private readonly startPlacingSubscription: Subscription;
  private readonly stopPlacingSubscription: Subscription;
  private tileMapComponent?: TilemapComponent;
  private navigationService?: NavigationService;
  private audioService?: AudioService;
  private fogOfWarComponent?: FogOfWarComponent;
  private actorIndex!: ActorIndexSystem;
  private escKey: Phaser.Input.Keyboard.Key | undefined;
  private shiftKey: Phaser.Input.Keyboard.Key | undefined;
  private downPointerLocation?: Vector2Simple;
  private spawnedCursorGameObjects: GameObjects.GameObject[] = [];
  private isDragging: boolean = false;
  private canBeDragPlaced: boolean = false;
  private canConstructBuildingAt: boolean = false;
  private invalidCursorPositions: Set<string> = new Set(); // Track positions where buildings can't be placed
  private actorsToMove: Set<GameObjects.GameObject> = new Set(); // Track actors that need to be moved when placing buildings

  // Helper: stable key based on snapped logical position (avoids z-offset and float drift)
  private getSnappedLogicalKey(go: GameObjects.GameObject): string | undefined {
    const t = getGameObjectLogicalTransform(go);
    if (!t) return undefined;
    const snapped = this.snapToGrid(new Vector2(t.x, t.y));
    return `${snapped.x},${snapped.y}`;
  }

  constructor(private scene: GameProbableWaffleScene) {
    this.startPlacingSubscription = this.startPlacingBuilding.subscribe((name) => this.spawn(name));
    this.stopPlacingSubscription = this.stopPlacingBuilding.subscribe(() => this.stop());
    this.scene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.on(Input.Events.GAME_OUT, this.stop, this);
    this.scene.input.on(Input.Events.POINTER_UP, this.onPointerUp, this);
    onSceneInitialized(scene, this.init, this);
    scene.onShutdown.subscribe(() => this.destroy());
    this.subscribeToCancelAction();
    this.subscribeToShiftKey();
  }

  private init() {
    this.tileMapComponent = getSceneComponent(this.scene, TilemapComponent);
    this.navigationService = getSceneService(this.scene, NavigationService);
    this.audioService = getSceneService(this.scene, AudioService);
    this.fogOfWarComponent = getSceneComponent(this.scene, FogOfWarComponent);
    this.actorIndex = getSceneService(this.scene, ActorIndexSystem)!;
  }

  get placingBuilding() {
    return !!this.building;
  }

  /**
   * Check if an actor should be ignored during building placement because it can be moved automatically.
   * This applies to actors that:
   * 1. Are owned by the current player
   * 2. Have ActorTranslateComponent (can move)
   * 3. Have PawnAiController (AI-controlled, can receive move orders)
   */
  private canActorBeAutoMoved(actor: GameObjects.GameObject): boolean {
    const currentPlayer = getCurrentPlayerNumber(this.scene);
    if (!currentPlayer) return false;

    // Check if actor is owned by current player
    const ownerComponent = getActorComponent(actor, OwnerComponent);
    if (!ownerComponent || ownerComponent.getOwner() !== currentPlayer) return false;

    // Check if actor has ActorTranslateComponent (can move)
    const actorTranslateComponent = getActorComponent(actor, ActorTranslateComponent);
    if (!actorTranslateComponent) return false;

    // Check if actor is AI-controlled (can receive orders)
    const pawnAiController = getActorComponent(actor, PawnAiController);
    if (!pawnAiController) return false;

    return true;
  }

  /**
   * Issue move orders to actors that need to be moved out of the way.
   * Finds a safe tile near the building and orders the actor to move there.
   * @param buildingsBeingPlaced - Array of building game objects that are being placed (to exclude their tiles)
   * @returns Promise that resolves once all actors have completed their movement
   */
  private async moveActorsOutOfTheWay(buildingsBeingPlaced: GameObjects.GameObject[]): Promise<void> {
    if (!this.navigationService || !this.tileMapComponent || this.actorsToMove.size === 0) return;

    try {
      // Collect all tiles that will be occupied by buildings being placed
      const occupiedTiles = new Set<string>();
      for (const building of buildingsBeingPlaced) {
        const tilesUnderBuilding = getTileCoordsUnderObject(this.tileMapComponent.tilemap, building);
        for (const tile of tilesUnderBuilding) {
          occupiedTiles.add(`${tile.x},${tile.y}`);
        }
      }

      const movementPromises: Promise<void>[] = [];

      this.actorsToMove.forEach((actor) => {
        const pawnAiController = getActorComponent(actor, PawnAiController);
        if (!pawnAiController) return;

        const actorTransform = getGameObjectLogicalTransform(actor);
        if (!actorTransform) return;

        // Get the actor's current tile position
        const actorCurrentTile = IsoHelper.isometricWorldToTileXY(
          this.scene,
          actorTransform.x,
          actorTransform.y,
          false
        );

        // Find a nearby walkable tile to move the actor to
        // Try tiles in a spiral pattern around the actor's current tile position
        let targetTile: Vector3Simple | undefined;
        const maxDistance = 5; // Search up to 5 tiles away

        for (let distance = 1; distance <= maxDistance && !targetTile; distance++) {
          for (let dx = -distance; dx <= distance && !targetTile; dx++) {
            for (let dy = -distance; dy <= distance && !targetTile; dy++) {
              // Only check tiles at the current distance (forming a square ring)
              if (Math.abs(dx) !== distance && Math.abs(dy) !== distance) continue;

              // Calculate test tile in tile coordinates
              const testTileX = actorCurrentTile.x + dx;
              const testTileY = actorCurrentTile.y + dy;

              // Skip if this is the actor's current tile
              if (testTileX === actorCurrentTile.x && testTileY === actorCurrentTile.y) {
                continue;
              }

              // Skip if this tile will be occupied by a building being placed
              const tileKey = `${testTileX},${testTileY}`;
              if (occupiedTiles.has(tileKey)) {
                continue;
              }

              // Check if the tile is walkable
              const isWalkable = this.navigationService!.isTileWalkable({ x: testTileX, y: testTileY });
              if (isWalkable) {
                targetTile = { x: testTileX, y: testTileY, z: 0 } satisfies Vector3Simple;
              }
            }
          }
        }

        // If we found a target tile, issue the move order and track the movement promise
        if (targetTile) {
          const order = new OrderData(OrderType.Move, { targetTileLocation: targetTile });
          pawnAiController.blackboard.overrideOrderQueueAndActiveOrder(order);
          pawnAiController.blackboard.setCurrentOrder(order);

          // Create a promise that resolves when the actor completes movement
          const movementPromise = this.waitForActorMovementComplete(actor);
          movementPromises.push(movementPromise);
        }
      });

      // Wait for all actors to complete their movement
      if (movementPromises.length > 0) {
        await Promise.all(movementPromises);
      }
    } catch (error) {
      console.error("Error in moveActorsOutOfTheWay:", error);
      // Don't let actor movement errors break building placement
    } finally {
      // Clear the set of actors to move
      this.actorsToMove.clear();
    }
  }

  /**
   * Waits for an actor to complete its current movement order.
   * Resolves when the actor's order changes or times out after a reasonable duration.
   * @param actor - The actor to monitor
   * @returns Promise that resolves when movement is complete
   */
  private waitForActorMovementComplete(actor: GameObjects.GameObject): Promise<void> {
    return new Promise((resolve) => {
      const pawnAiController = getActorComponent(actor, PawnAiController);
      if (!pawnAiController) {
        resolve();
        return;
      }

      const maxWaitTime = 30000; // 30 seconds max wait
      const startTime = Date.now();
      const checkInterval = 100; // Check every 100ms

      const checkMovementComplete = () => {
        const elapsed = Date.now() - startTime;

        // Timeout safety check
        if (elapsed > maxWaitTime) {
          resolve();
          return;
        }

        const currentOrder = pawnAiController.blackboard.getCurrentOrder();

        // If no current order or order is no longer Move type, movement is complete
        if (!currentOrder || currentOrder.orderType !== OrderType.Move) {
          resolve();
          return;
        }

        // Check if actor is close enough to target
        const actorTransform = getGameObjectLogicalTransform(actor);
        if (currentOrder.data.targetTileLocation && actorTransform) {
          const targetTile = currentOrder.data.targetTileLocation;
          const distance = Math.sqrt(
            Math.pow(actorTransform.x - targetTile.x, 2) + Math.pow(actorTransform.y - targetTile.y, 2)
          );

          // Consider movement complete if within ~1 tile distance
          if (distance < 2) {
            resolve();
            return;
          }
        }

        // Not complete yet, check again later
        this.scene.time.delayedCall(checkInterval, checkMovementComplete);
      };

      // Start checking
      checkMovementComplete();
    });
  }

  private spawn(name: ObjectNames) {
    if (this.building) this.stop();

    const definition = pwActorDefinitions[name as ObjectNames]?.components?.constructable;
    if (!definition) return;

    this.canBeDragPlaced = definition.canBeDragPlaced;

    const pointer = this.scene.input.activePointer;
    let worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    worldPosition = this.snapToGrid(worldPosition);

    const spawnLogicalLocation = {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
    } as Vector3Simple;

    const actor = ActorManager.createActorCore(this.scene, name, {
      representable: {
        logicalWorldTransform: spawnLogicalLocation
      }
    } satisfies ActorDefinition);

    this.building = this.scene.add.existing(actor);
    this.pointerLocation = worldPosition;

    if (!this.isDragging) {
      this.drawPlacementGrid(worldPosition);
      this.drawAttackRange(worldPosition);
    }
  }

  private handlePointerMove(pointer: Input.Pointer) {
    if (this.downPointerLocation && this.canBeDragPlaced) {
      this.isDragging = true;
    }

    if (!this.building) return;

    let worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    worldPosition = this.snapToGrid(worldPosition);

    if (
      this.pointerLocation &&
      this.pointerLocation.x === worldPosition.x &&
      this.pointerLocation.y === worldPosition.y
    )
      return;

    this.pointerLocation = worldPosition;
    if (this.isDragging) {
      this.clearSpawnedCursorGameObjects();
      this.drawLineBetweenPoints();
    }

    const representableComponent = getActorComponent(this.building, RepresentableComponent);
    if (representableComponent == null) {
      console.error("Building cursor: RepresentableComponent not found on building game object.");
      return;
    }
    representableComponent.logicalWorldTransform = {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
    } satisfies Vector3Simple;
    DepthHelper.setActorDepth(this.building);

    // Check if the current building can be placed
    this.canConstructBuildingAt = this.getCanConstructBuildingAt(this.building);

    this.clearGraphics();
    if (!this.isDragging) {
      this.drawPlacementGrid(worldPosition);
      this.drawAttackRange(worldPosition);
    }

    // Update all objects for proper visual feedback
    this.updateObjectVisuals();
  }

  private updateObjectVisuals() {
    // First, check and update all spawned cursor game objects
    if (this.isDragging) {
      // Reset invalid positions set
      this.invalidCursorPositions.clear();
      const cumulativeCost: Partial<Record<ResourceType, number>> = {};

      // Check each spawned object individually and track which ones can't be placed
      for (const gameObject of this.spawnedCursorGameObjects) {
        const canPlace = this.getCanConstructBuildingAt(
          gameObject,
          [...this.spawnedCursorGameObjects, this.building!],
          cumulativeCost
        );

        const cost = getCostForObjectName(gameObject.name as ObjectNames);
        if (cost) {
          for (const resource in cost) {
            cumulativeCost[resource as ResourceType] =
              (cumulativeCost[resource as ResourceType] || 0) + cost[resource as ResourceType]!;
          }
        }

        if (!canPlace) {
          const key = this.getSnappedLogicalKey(gameObject);
          if (key) this.invalidCursorPositions.add(key);
        }

        // Apply visual treatment to each object based on whether it can be placed
        const constructionInterface = getActorComponent(gameObject, ConstructionGameObjectInterfaceComponent);
        if (constructionInterface) {
          constructionInterface.tintAndAlphaCursor(canPlace ? undefined : 0xff0000, 0.7);
        }
      }
    } else if (this.building) {
      // If not dragging, just update the main building cursor
      const constructionInterface = getActorComponent(this.building, ConstructionGameObjectInterfaceComponent);
      if (constructionInterface) {
        this.canConstructBuildingAt = this.getCanConstructBuildingAt(this.building);
        constructionInterface.tintAndAlphaCursor(this.canConstructBuildingAt ? undefined : 0xff0000, 0.7);
      }
    }
  }

  private _canPlaceAt(
    tiles: Vector2Simple[],
    ignoreGameObjects: GameObjects.GameObject[] = [],
    trackActorsToMove: boolean = false
  ): boolean {
    if (!this.tileMapComponent || !this.navigationService || !this.fogOfWarComponent) return false;

    // 1. Check Fog of War
    const allTilesVisible = tiles.every((tile) => {
      const tileVisible = this.fogOfWarComponent!.getTileVisibility(tile.x, tile.y);
      return tileVisible === "visible";
    });
    if (!allTilesVisible) return false;

    // 2. Check Walkability
    const allTilesWalkable = tiles.every((tile) => this.navigationService!.isTileWalkable(tile));
    if (!allTilesWalkable) return false;

    // 3. Check for collisions with other actors
    const objectsToIgnore = new Set<GameObjects.GameObject>(ignoreGameObjects);
    const children = this.actorIndex.getAllIdActors().filter((c) => {
      if (objectsToIgnore.has(c)) return false;

      const tilesUnderChild = getTileCoordsUnderObject(this.tileMapComponent!.tilemap, c);
      if (!tilesUnderChild.length) return false;

      const overlaps = tiles.some((tile) =>
        tilesUnderChild.some((childTile) => childTile.x === tile.x && childTile.y === tile.y)
      );

      if (overlaps && this.canActorBeAutoMoved(c)) {
        if (trackActorsToMove) {
          this.actorsToMove.add(c);
        }
        return false; // Don't count as a collision
      }

      return overlaps;
    });

    return children.length === 0;
  }

  getCanConstructBuildingAt(
    building?: GameObjects.GameObject,
    ignoreGameObjects: GameObjects.GameObject[] = [],
    currentCost: Partial<Record<ResourceType, number>> = {},
    trackActorsToMove: boolean = false
  ): boolean {
    if (!this.tileMapComponent || !building) return false;

    const playerNumber = getCurrentPlayerNumber(this.scene);
    if (playerNumber) {
      const validation = ProductionValidator.validateObject(
        this.scene,
        playerNumber,
        building.name as ObjectNames,
        currentCost
      );
      if (!validation.canQueue) {
        return false;
      }
    }

    const tilesUnderBuilding = getTileCoordsUnderObject(this.tileMapComponent.tilemap, building);
    if (!tilesUnderBuilding.length) return false;

    // Create the list of objects to ignore (don't collide with self or with objects in the ignore list)
    const objectsToIgnore = [building, ...ignoreGameObjects];

    return this._canPlaceAt(tilesUnderBuilding, objectsToIgnore, trackActorsToMove);
  }

  private drawPlacementGrid(location: Vector2Simple) {
    if (!location || !this.building) return;

    const bounds = getGameObjectBounds(this.building);
    if (!bounds) return;

    const gridGraphics = this.placementGrid ?? this.scene.add.graphics();
    const tileSize = this.tileSize;
    const xPos = location.x;
    const yPos = location.y;

    gridGraphics.clear();

    const buildingWidth = Math.floor(bounds.width / tileSize);
    const buildingHeight = Math.floor(bounds.width / tileSize);

    // Determine the range for inner and outer grid
    const innerRangeX = Math.floor(buildingWidth / 2);
    const innerRangeY = Math.floor(buildingHeight / 2);
    const outerRangeX = innerRangeX + 2; // 2 tiles beyond
    const outerRangeY = innerRangeY + 2; // 2 tiles beyond

    // Helper function to check if a specific tile position is occupied
    const isTileOccupied = (worldX: number, worldY: number): boolean => {
      if (!this.tileMapComponent) return true;

      // Convert world coordinates to tile coordinates
      const tileCoord = IsoHelper.isometricWorldToTileXY(this.scene, worldX, worldY, false);
      // for some reason we need to ceil the clicked tile - its not ok if se set snapToFloor to true
      tileCoord.x = Math.ceil(tileCoord.x);
      tileCoord.y = Math.ceil(tileCoord.y);

      const ignoreList = [this.building!, ...this.spawnedCursorGameObjects];
      return !this._canPlaceAt([tileCoord], ignoreList, false);
    };

    const drawDiamond = (isoX: number, isoY: number, color: number, fill: boolean, outline: boolean) => {
      const path = new Phaser.Geom.Polygon([
        isoX,
        isoY - tileSize / 4,
        isoX + tileSize / 2,
        isoY,
        isoX,
        isoY + tileSize / 4,
        isoX - tileSize / 2,
        isoY
      ]);

      if (fill) {
        gridGraphics.fillStyle(color, 0.3);
        gridGraphics.fillPoints(path.points, true);
      }
      if (outline) {
        gridGraphics.lineStyle(2, color, 1);
        gridGraphics.strokePoints(path.points, true);
      }
    };

    const tilesToDraw: { x: number; y: number; color: number; isInner: boolean; occupied: boolean }[] = [];
    for (let i = -outerRangeX; i <= outerRangeX; i++) {
      for (let j = -outerRangeY; j <= outerRangeY; j++) {
        const isoX = xPos + (i - j) * (tileSize / 2);
        const isoY = yPos + (i + j) * (tileSize / 4);
        const occupied = isTileOccupied(isoX, isoY);
        tilesToDraw.push({
          x: isoX,
          y: isoY,
          color: occupied ? 0xff0000 : 0x00ff00,
          isInner: Math.abs(i) <= innerRangeX && Math.abs(j) <= innerRangeY,
          occupied
        });
      }
    }

    // Draw fills first
    tilesToDraw.forEach((t) => {
      if (t.isInner) {
        drawDiamond(t.x, t.y, t.color, true, false);
      }
    });

    // Then draw outlines, ensuring red is on top of green
    const greenTiles = tilesToDraw.filter((t) => !t.occupied);
    const redTiles = tilesToDraw.filter((t) => t.occupied);
    greenTiles.forEach((t) => drawDiamond(t.x, t.y, t.color, false, true));
    redTiles.forEach((t) => drawDiamond(t.x, t.y, t.color, false, true));

    this.placementGrid = gridGraphics;
  }

  private snapToGrid(worldPosition: Vector2): Vector2 {
    // Constants for isometric grid
    const tileWidth = this.tileSize;
    const tileHeight = this.tileSize / 2;

    // Convert to isometric coordinates
    // Divide by half-tile dimensions to normalize the grid
    const isoX = (worldPosition.x / (tileWidth / 2) - worldPosition.y / (tileHeight / 2)) / 2;
    const isoY = (worldPosition.x / (tileWidth / 2) + worldPosition.y / (tileHeight / 2)) / 2;

    // Snap to grid
    const snappedIsoX = Math.round(isoX);
    const snappedIsoY = Math.round(isoY);

    // Convert back to world coordinates
    // Multiply by tile dimensions to get back to world space
    const snappedX = ((snappedIsoX + snappedIsoY) * tileWidth) / 2;
    const snappedY = ((snappedIsoY - snappedIsoX) * tileHeight) / 2;

    return new Vector2(snappedX, snappedY);
  }

  private drawAttackRange(location: Vector2Simple) {
    if (!location || !this.building) return;

    const definition = pwActorDefinitions[this.building.name as ObjectNames];
    if (!definition) return;

    const attackDefinition = definition.components?.attack;
    if (!attackDefinition || !attackDefinition.attacks.length) return;

    if (this.attackRangeCircle) {
      this.attackRangeCircle.clear();
    }

    const primaryAttack = attackDefinition.attacks[0];
    if (primaryAttack === undefined) return;

    const rangeRadiusX = primaryAttack.range * this.tileSize;
    const rangeRadiusY = rangeRadiusX / 2;
    const attackRangeGraphics = this.scene.add.graphics();
    attackRangeGraphics.lineStyle(2, 0xff0000, 1);

    const xPos = location.x;
    const yPos = location.y;

    attackRangeGraphics.strokeEllipse(xPos, yPos, rangeRadiusX, rangeRadiusY);

    // Draw high ground bonus range if the weapon has one
    const highGroundBonus = primaryAttack.highGroundRangeBonus ?? 0;
    if (highGroundBonus > 0) {
      const bonusRangeRadiusX = (primaryAttack.range + highGroundBonus) * this.tileSize;
      const bonusRangeRadiusY = bonusRangeRadiusX / 2;
      // Use a lighter/dashed style for the potential high ground bonus range
      attackRangeGraphics.lineStyle(1, 0xff6600, 0.5);
      attackRangeGraphics.strokeEllipse(xPos, yPos, bonusRangeRadiusX, bonusRangeRadiusY);
    }

    this.attackRangeCircle = attackRangeGraphics;
  }

  private clearGraphics() {
    if (this.placementGrid) {
      this.placementGrid.clear();
    }
    if (this.attackRangeCircle) {
      this.attackRangeCircle.clear();
    }
  }

  private onPointerDown(pointer: Input.Pointer) {
    if (!this.pointerLocation || !this.building) return;
    if (pointer.rightButtonReleased()) {
      this.stop();
      return;
    }

    this.downPointerLocation = this.snapToGrid(new Vector2(this.pointerLocation.x, this.pointerLocation.y));
  }

  private onPointerUp(pointer: Input.Pointer) {
    if (!this.pointerLocation || !this.building || !this.downPointerLocation) return;
    if (pointer.rightButtonReleased()) {
      this.stop();
      return;
    }

    // Re-validate just before placing
    this.updateObjectVisuals();

    if (this.isDragging) {
      // For drag operations, check if all buildings can be placed
      const allValid = this.spawnedCursorGameObjects.length === 0 || this.invalidCursorPositions.size === 0;

      if (!allValid) {
        const soundDefinition = UiFeedbackBuildDeniedSound;
        this.audioService?.playAudioSprite(soundDefinition.key, soundDefinition.spriteName);
        this.stop();
        return;
      }
    } else {
      // For single placement, check the main cursor
      if (!this.canConstructBuildingAt) {
        const soundDefinition = UiFeedbackBuildDeniedSound;
        this.audioService?.playAudioSprite(soundDefinition.key, soundDefinition.spriteName);
        this.stop();
        return;
      }
    }

    // Filter out any objects at invalid positions when in drag mode
    const shiftKeyDown = this.shiftKey?.isDown || false;

    if (!this.canBeDragPlaced && shiftKeyDown) {
      const buildingName = this.building.name as ObjectNames;
      this.placeBuildings();
      this.startPlacingBuilding.emit(buildingName);
      return;
    }

    this.placeBuildings();
  }

  private drawLineBetweenPoints() {
    if (!this.downPointerLocation || !this.pointerLocation) return;

    const snappedDownPointer = this.snapToGrid(new Vector2(this.downPointerLocation.x, this.downPointerLocation.y));
    const snappedPointer = this.snapToGrid(new Vector2(this.pointerLocation.x, this.pointerLocation.y));

    const startX = snappedDownPointer.x;
    const startY = snappedDownPointer.y;
    const endX = snappedPointer.x;
    const endY = snappedPointer.y;

    // Convert to isometric coordinates using the same 2:1 ratio as the grid
    // Note: keep conversions consistent with snapToGrid (divide by 2)
    const isoStartX = (startX / (this.tileSize / 2) - startY / (this.tileSize / 4)) / 2;
    const isoStartY = (startX / (this.tileSize / 2) + startY / (this.tileSize / 4)) / 2;
    const isoEndX = (endX / (this.tileSize / 2) - endY / (this.tileSize / 4)) / 2;
    const isoEndY = (endX / (this.tileSize / 2) + endY / (this.tileSize / 4)) / 2;

    let midpointX, midpointY;

    // Calculate the differences in isometric space
    const dIsoX = isoEndX - isoStartX;
    const dIsoY = isoEndY - isoStartY;

    // Determine which isometric axis to follow first
    if (Math.abs(dIsoX) > Math.abs(dIsoY)) {
      // Move along isometric X axis first
      const isoMidX = isoEndX;
      const isoMidY = isoStartY;

      // Convert back to screen coordinates
      midpointX = (isoMidX + isoMidY) * (this.tileSize / 2);
      midpointY = (isoMidY - isoMidX) * (this.tileSize / 4);
    } else {
      // Move along isometric Y axis first
      const isoMidX = isoStartX;
      const isoMidY = isoEndY;

      // Convert back to screen coordinates
      midpointX = (isoMidX + isoMidY) * (this.tileSize / 2);
      midpointY = (isoMidY - isoMidX) * (this.tileSize / 4);
    }

    // Ensure midpoint is snapped to the isometric grid
    const snappedMidpoint = this.snapToGrid(new Vector2(midpointX, midpointY));
    midpointX = snappedMidpoint.x;
    midpointY = snappedMidpoint.y;

    // Calculate points along the path in isometric space
    const generatePoints = (from: Vector2, to: Vector2): Vector2[] => {
      const points: Vector2[] = [];

      // Convert screen coordinates to isometric coordinates
      const fromIsoX = (from.x / (this.tileSize / 2) - from.y / (this.tileSize / 4)) / 2;
      const fromIsoY = (from.x / (this.tileSize / 2) + from.y / (this.tileSize / 4)) / 2;
      const toIsoX = (to.x / (this.tileSize / 2) - to.y / (this.tileSize / 4)) / 2;
      const toIsoY = (to.x / (this.tileSize / 2) + to.y / (this.tileSize / 4)) / 2;

      // Calculate differences in isometric space
      const dx = toIsoX - fromIsoX;
      const dy = toIsoY - fromIsoY;

      // Number of steps using Manhattan distance in iso space
      const steps = Math.max(Math.abs(dx), Math.abs(dy));

      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 1 : i / steps;
        // Interpolate in isometric space
        const isoX = fromIsoX + dx * t;
        const isoY = fromIsoY + dy * t;

        // Convert back to screen coordinates and snap to grid
        const screenX = (isoX + isoY) * (this.tileSize / 2);
        const screenY = (isoY - isoX) * (this.tileSize / 4);
        const snappedPoint = this.snapToGrid(new Vector2(screenX, screenY));
        points.push(snappedPoint);
      }

      return points;
    };

    // Generate points for both segments
    const firstSegmentPoints = generatePoints(new Vector2(startX, startY), new Vector2(midpointX, midpointY));
    const secondSegmentPoints = generatePoints(new Vector2(midpointX, midpointY), new Vector2(endX, endY));

    // Combine points and remove duplicates
    const allPoints = [...firstSegmentPoints];
    for (const point of secondSegmentPoints) {
      const isDuplicate = allPoints.some((existing) => existing.x === point.x && existing.y === point.y);
      if (!isDuplicate) {
        allPoints.push(point);
      }
    }

    // Spawn buildings at each point (points are already snapped)
    for (const point of allPoints) {
      // if point 0,0, then skip it
      if (point.x === 0 && point.y === 0) continue;

      this.spawnCursorGameObjectAt(point.x, point.y);
    }

    // After spawning all objects, check their placement validity
    this.updateObjectVisuals();
  }

  private spawnCursorGameObjectAt(x: number, y: number) {
    const actor = ActorManager.createActorCore(this.scene, this.building!.name as ObjectNames, {
      representable: {
        logicalWorldTransform: { x, y, z: 0 }
      }
    } satisfies ActorDefinition);
    const gameObject = this.scene.add.existing(actor);
    this.spawnedCursorGameObjects.push(gameObject);
    DepthHelper.setActorDepth(gameObject);

    if (!this.isDragging) {
      this.drawPlacementGrid({ x, y });
      this.drawAttackRange({ x, y });
    }
  }

  private clearSpawnedCursorGameObjects() {
    for (const gameObject of this.spawnedCursorGameObjects) {
      gameObject.destroy();
    }
    this.spawnedCursorGameObjects = [];
    this.invalidCursorPositions.clear();
  }

  private async placeBuildings() {
    // Clear the actors to move set before checking placement
    this.actorsToMove.clear();

    // Filter out any objects at invalid positions when in drag mode
    const objectsToPlace = this.isDragging
      ? this.spawnedCursorGameObjects.filter((obj) => {
          const key = this.getSnappedLogicalKey(obj);
          return key !== undefined && !this.invalidCursorPositions.has(key);
        })
      : [];

    // Track actors that need to be moved for all buildings being placed
    if (this.isDragging && objectsToPlace.length) {
      for (const gameObject of objectsToPlace) {
        this.getCanConstructBuildingAt(gameObject, [...this.spawnedCursorGameObjects, this.building!], {}, true);
      }
    } else if (this.building) {
      this.getCanConstructBuildingAt(this.building, [], {}, true);
    }

    // Collect all buildings being placed to pass to moveActorsOutOfTheWay
    const buildingsBeingPlaced: GameObjects.GameObject[] =
      this.isDragging && objectsToPlace.length ? objectsToPlace : this.building ? [this.building] : [];

    // Exit build mode immediately
    const buildingToPlace = this.building;
    this.building = undefined;
    this.clearGraphics();

    // Move actors out of the way before placing buildings, wait for them to complete
    await this.moveActorsOutOfTheWay(buildingsBeingPlaced);

    if (this.isDragging && objectsToPlace.length) {
      buildingToPlace?.destroy();
      for (const gameObject of objectsToPlace) {
        this.spawnConstructionSite(gameObject);
      }
    } else if (buildingToPlace) {
      this.spawnConstructionSite(buildingToPlace);
    } else {
      throw new Error("No building to place");
    }

    this.pointerLocation = undefined;
    this.downPointerLocation = undefined;
    this.spawnedCursorGameObjects = [];
    this.invalidCursorPositions.clear();
    this.isDragging = false;
  }

  private spawnConstructionSite(gameObject: GameObjects.GameObject) {
    const currentPlayer = getCurrentPlayerNumber(this.scene);
    const actorDefinition = {
      ...(currentPlayer && {
        owner: {
          ownerId: currentPlayer
        }
      })
    } satisfies ActorDefinition;

    upgradeFromCoreToConstructingActorData(gameObject, actorDefinition);
    // todo Save to game state

    // instruct the builder to start building
    const idComponent = getActorComponent(gameObject, IdComponent)!;
    emitEventIssueActorCommandToSelectedActors(this.scene, { objectIds: [idComponent.id] });
  }

  static spawnBuildingForPlayer(
    scene: Phaser.Scene,
    name: ObjectNames,
    logicalWorldTransform: Vector3Simple,
    playerNumber?: number
  ) {
    const actorDefinition = {
      ...(playerNumber && {
        owner: {
          ownerId: playerNumber
        }
      }),
      representable: {
        logicalWorldTransform
      }
    } satisfies ActorDefinition;

    const actor = ActorManager.createActorConstructing(scene, name, actorDefinition);
    const gameObject = scene.add.existing(actor);
    DepthHelper.setActorDepth(gameObject);

    return gameObject;
  }

  private subscribeToCancelAction() {
    this.escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (!this.escKey) return;
    this.escKey.on(Phaser.Input.Keyboard.Events.DOWN, this.stop, this);
  }

  private subscribeToShiftKey() {
    this.shiftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  stop() {
    this.building?.destroy();
    this.building = undefined;
    this.pointerLocation = undefined;
    this.downPointerLocation = undefined;
    this.clearGraphics();
    this.clearSpawnedCursorGameObjects();
    this.actorsToMove.clear();
    this.isDragging = false;
  }

  private destroy() {
    this.stop();
    this.scene.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Input.Events.POINTER_UP, this.onPointerUp, this);
    this.scene.input.off(Input.Events.GAME_OUT, this.stop, this);
    this.escKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.stop, this);
    this.shiftKey?.destroy();
    this.startPlacingSubscription.unsubscribe();
    this.stopPlacingSubscription.unsubscribe();
  }
}
