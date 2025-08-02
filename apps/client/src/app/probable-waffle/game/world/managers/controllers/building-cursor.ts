import { GameObjects, Input } from "phaser";
import { ActorDefinition, ObjectNames, Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../../data/actor-manager";
import {
  getGameObjectBounds,
  getGameObjectLogicalTransform,
  getGameObjectRenderedTransform,
  onSceneInitialized
} from "../../../data/game-object-helper";
import { DepthHelper } from "../../map/depth.helper";
import { pwActorDefinitions } from "../../../data/actor-definitions";
import { upgradeFromCoreToConstructingActorData } from "../../../data/actor-data";
import { emitEventIssueActorCommandToSelectedActors, getCurrentPlayerNumber } from "../../../data/scene-data";
import { EventEmitter } from "@angular/core";
import GameProbableWaffleScene from "../../../scenes/GameProbableWaffleScene";
import { Subscription } from "rxjs";
import { TilemapComponent } from "../../../scenes/components/tilemap.component";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { IdComponent } from "../../../entity/actor/components/id-component";
import { getSceneComponent, getSceneService } from "../../../scenes/components/scene-component-helpers";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { NavigationService } from "../../../scenes/services/navigation.service";
import { AudioService } from "../../../scenes/services/audio.service";
import { UiFeedbackBuildDeniedSound } from "../../../sfx/UiFeedbackSfx";
import { FogOfWarComponent } from "../../../scenes/components/fog-of-war.component";
import { RepresentableComponent } from "../../../entity/actor/components/representable-component";
import Vector2 = Phaser.Math.Vector2;

export class BuildingCursor {
  placementGrid?: GameObjects.Graphics;
  allCellsAreValid = false;
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
  private escKey: Phaser.Input.Keyboard.Key | undefined;
  private shiftKey: Phaser.Input.Keyboard.Key | undefined;
  private downPointerLocation?: Vector2Simple;
  private spawnedCursorGameObjects: GameObjects.GameObject[] = [];
  private isDragging: boolean = false;
  private canBeDragPlaced: boolean = false;
  private canConstructBuildingAt: boolean = false;
  private invalidCursorPositions: Set<string> = new Set(); // Track positions where buildings can't be placed

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
  }

  get placingBuilding() {
    return !!this.building;
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
      logicalWorldTransform: spawnLogicalLocation
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

      // Check each spawned object individually and track which ones can't be placed
      for (const gameObject of this.spawnedCursorGameObjects) {
        const transform = getGameObjectRenderedTransform(gameObject);
        if (!transform) continue;

        const canPlace = this.getCanConstructBuildingAt(gameObject, [...this.spawnedCursorGameObjects, this.building!]);

        if (!canPlace) {
          // Track this position as invalid
          this.invalidCursorPositions.add(`${transform.x},${transform.y}`);
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
        constructionInterface.tintAndAlphaCursor(this.canConstructBuildingAt ? undefined : 0xff0000, 0.7);
      }
    }
  }

  getCanConstructBuildingAt(
    building?: GameObjects.GameObject,
    ignoreGameObjects: GameObjects.GameObject[] = []
  ): boolean {
    if (!this.tileMapComponent || !this.navigationService || !this.fogOfWarComponent || !building) return false;

    const tilesUnderBuilding = getTileCoordsUnderObject(this.tileMapComponent.tilemap, building);
    if (!tilesUnderBuilding.length) return false;

    const isAreaBeneathGameObjectWalkable = this.navigationService.isAreaBeneathGameObjectWalkable(building);
    if (!isAreaBeneathGameObjectWalkable) return false;

    const bounds = getGameObjectBounds(building);
    if (!bounds) return false;

    const minX = Math.floor(bounds.x);
    const minY = Math.floor(bounds.y);
    const maxX = Math.floor(bounds.x + bounds.width);
    const maxY = Math.floor(bounds.y + bounds.height);

    const allTileVisible = tilesUnderBuilding.every((tile) => {
      const tileVisible = this.fogOfWarComponent!.getTileVisibility(tile.x, tile.y);
      return tileVisible === "visible";
    });

    if (!allTileVisible) return false;

    // Create the list of objects to ignore (don't collide with self or with objects in the ignore list)
    const objectsToIgnore = new Set<GameObjects.GameObject>([building, ...ignoreGameObjects]);

    // Check for collisions with existing game objects (excluding those in the ignore list)
    const children = this.scene.children.list.filter((c) => {
      if (objectsToIgnore.has(c)) return false;
      if (c instanceof Phaser.GameObjects.Graphics) return false;

      // pulling logical transform from the game object, so we know on which tile he is standing (z axis invariant)
      const logicalTransform = getGameObjectLogicalTransform(c);
      if (!logicalTransform) return false;

      // Quick bounds check
      if (
        logicalTransform.x < minX ||
        logicalTransform.x > maxX ||
        logicalTransform.y < minY ||
        logicalTransform.y > maxY
      )
        return false;

      // More precise tile-based collision check
      const tilesUnderChild = getTileCoordsUnderObject(this.tileMapComponent!.tilemap, c);
      if (!tilesUnderChild.length) return false;

      return tilesUnderBuilding.some((tile) =>
        tilesUnderChild.some((childTile) => childTile.x === tile.x && childTile.y === tile.y)
      );
    });

    return children.length === 0;
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

    const canConstruct = this.canConstructBuildingAt;

    gridGraphics.lineStyle(2, canConstruct ? 0x00ff00 : 0xff0000, 1);
    gridGraphics.fillStyle(canConstruct ? 0x00ff00 : 0xff0000, 0.3);

    function drawIsoDiamond(isoX: number, isoY: number, fill: boolean) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(isoX, isoY - tileSize / 4);
      gridGraphics.lineTo(isoX + tileSize / 2, isoY);
      gridGraphics.lineTo(isoX, isoY + tileSize / 4);
      gridGraphics.lineTo(isoX - tileSize / 2, isoY);
      gridGraphics.closePath();

      if (fill) {
        gridGraphics.fillPath();
      } else {
        gridGraphics.stroke();
      }
    }

    const buildingWidth = Math.floor(bounds.width / tileSize);
    const buildingHeight = Math.floor(bounds.width / tileSize);

    // Determine the range for inner and outer grid
    const innerRangeX = Math.floor(buildingWidth / 2);
    const innerRangeY = Math.floor(buildingHeight / 2);
    const outerRangeX = innerRangeX + 2; // 2 tiles beyond
    const outerRangeY = innerRangeY + 2; // 2 tiles beyond

    // Draw the entire grid
    for (let i = -outerRangeX; i <= outerRangeX; i++) {
      for (let j = -outerRangeY; j <= outerRangeY; j++) {
        const isoX = xPos + (i - j) * (tileSize / 2);
        const isoY = yPos + (i + j) * (tileSize / 4);

        // Determine if this is part of the inner area (building footprint)
        const isInnerTile = Math.abs(i) <= innerRangeX && Math.abs(j) <= innerRangeY;

        drawIsoDiamond(isoX, isoY, isInnerTile);
      }
    }

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

    const rangeRadiusX = primaryAttack.range * this.tileSize;
    const rangeRadiusY = rangeRadiusX / 2;
    const attackRangeGraphics = this.scene.add.graphics();
    attackRangeGraphics.lineStyle(2, 0xff0000, 1);

    const xPos = location.x;
    const yPos = location.y;

    attackRangeGraphics.strokeEllipse(xPos, yPos, rangeRadiusX, rangeRadiusY);

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
    const isoStartX = startX / (this.tileSize / 2) - startY / (this.tileSize / 4);
    const isoStartY = startX / (this.tileSize / 2) + startY / (this.tileSize / 4);
    const isoEndX = endX / (this.tileSize / 2) - endY / (this.tileSize / 4);
    const isoEndY = endX / (this.tileSize / 2) + endY / (this.tileSize / 4);

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
      midpointX = ((isoMidX + isoMidY) * (this.tileSize / 2)) / 2;
      midpointY = ((isoMidY - isoMidX) * (this.tileSize / 4)) / 2;
    } else {
      // Move along isometric Y axis first
      const isoMidX = isoStartX;
      const isoMidY = isoEndY;

      // Convert back to screen coordinates
      midpointX = ((isoMidX + isoMidY) * (this.tileSize / 2)) / 2;
      midpointY = ((isoMidY - isoMidX) * (this.tileSize / 4)) / 2;
    }

    // Ensure midpoint is snapped to the isometric grid
    const snappedMidpoint = new Vector2(midpointX, midpointY);
    midpointX = snappedMidpoint.x;
    midpointY = snappedMidpoint.y;

    // Calculate points along the path in isometric space
    const generatePoints = (from: Vector2, to: Vector2): Vector2[] => {
      const points: Vector2[] = [];

      // Convert screen coordinates to isometric coordinates
      const fromIsoX = from.x / (this.tileSize / 2) - from.y / (this.tileSize / 4);
      const fromIsoY = from.x / (this.tileSize / 2) + from.y / (this.tileSize / 4);
      const toIsoX = to.x / (this.tileSize / 2) - to.y / (this.tileSize / 4);
      const toIsoY = to.x / (this.tileSize / 2) + to.y / (this.tileSize / 4);

      // Calculate differences in isometric space
      const dx = toIsoX - fromIsoX;
      const dy = toIsoY - fromIsoY;

      // Calculate number of steps needed (using Manhattan distance in iso space)
      const steps = Math.max(Math.abs(dx), Math.abs(dy)) / 2;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Interpolate in isometric space
        const isoX = fromIsoX + dx * t;
        const isoY = fromIsoY + dy * t;

        // Convert back to screen coordinates
        const screenX = ((isoX + isoY) * (this.tileSize / 2)) / 2;
        const screenY = ((isoY - isoX) * (this.tileSize / 4)) / 2;

        // Snap to grid and add point
        const snappedPoint = new Vector2(screenX, screenY);
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

    // Spawn buildings at each point
    for (const point of allPoints) {
      // if point 0,0, then skip it
      if (point.x === 0 && point.y === 0) continue;

      this.spawnCursorGameObjectAt(point.x, point.y);
    }

    // After spawning all objects, check their placement validity
    this.updateObjectVisuals();
  }

  private spawnCursorGameObjectAt(x: number, y: number) {
    const actor = ActorManager.createActorCore(this.scene, this.building!.name as ObjectNames, { x, y, z: 0 });
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

  private placeBuildings() {
    // Filter out any objects at invalid positions when in drag mode
    const objectsToPlace = this.isDragging
      ? this.spawnedCursorGameObjects.filter((obj) => {
          const renderedTransform = getGameObjectRenderedTransform(obj);
          return renderedTransform && !this.invalidCursorPositions.has(`${renderedTransform.x},${renderedTransform.y}`);
        })
      : [];

    if (this.isDragging && objectsToPlace.length) {
      this.building?.destroy();
      for (const gameObject of objectsToPlace) {
        this.spawnConstructionSite(gameObject);
      }
    } else if (this.building) {
      this.spawnConstructionSite(this.building);
    } else {
      throw new Error("No building to place");
    }

    this.building = undefined;
    this.pointerLocation = undefined;
    this.downPointerLocation = undefined;
    this.clearGraphics();
    this.spawnedCursorGameObjects = [];
    this.invalidCursorPositions.clear();
    this.isDragging = false;
  }

  private spawnConstructionSite(gameObject: GameObjects.GameObject) {
    const currentPlayer = getCurrentPlayerNumber(this.scene);
    const actorDefinition = {
      ...(currentPlayer && { owner: currentPlayer })
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
    logicalTransform: Vector3Simple,
    playerNumber?: number
  ) {
    const actorDefinition = {
      ...(playerNumber && { owner: playerNumber }),
      logicalWorldTransform: logicalTransform
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
