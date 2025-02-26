import { GameObjects, Input } from "phaser";
import { ActorDefinition, Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../../data/actor-manager";
import { ObjectNames } from "../../../data/object-names";
import { getGameObjectBounds, getGameObjectTransform } from "../../../data/game-object-helper";
import { DepthHelper } from "../../map/depth.helper";
import { pwActorDefinitions } from "../../../data/actor-definitions";
import { upgradeFromCoreToConstructingActorData } from "../../../data/actor-data";
import { getCurrentPlayerNumber } from "../../../data/scene-data";
import { EventEmitter } from "@angular/core";
import GameProbableWaffleScene from "../../../scenes/GameProbableWaffleScene";
import { Subscription } from "rxjs";
import { TilemapComponent } from "../../../scenes/components/tilemap.component";
import Vector2 = Phaser.Math.Vector2;
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";

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
  private escKey: Phaser.Input.Keyboard.Key | undefined;
  private downPointerLocation?: Vector2Simple;
  private spawnedCursorGameObjects: GameObjects.GameObject[] = [];
  private isDragging: boolean = false;
  private canBeDragPlaced: boolean = false;

  constructor(private scene: GameProbableWaffleScene) {
    this.startPlacingSubscription = this.startPlacingBuilding.subscribe((name) => this.spawn(name));
    this.stopPlacingSubscription = this.stopPlacingBuilding.subscribe(() => this.stop());
    this.scene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.on(Input.Events.GAME_OUT, this.stop, this);
    this.scene.input.on(Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.onShutdown.subscribe(() => this.destroy());
    this.subscribeToCancelAction();
  }

  private spawn(name: ObjectNames) {
    if (this.building) this.stop();

    const definition = pwActorDefinitions[name as ObjectNames]?.components?.constructable;
    if (!definition) return;

    this.canBeDragPlaced = definition.canBeDragPlaced;

    const pointer = this.scene.input.activePointer;
    let worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    worldPosition = this.snapToGrid(worldPosition);

    const actor = ActorManager.createActorCore(this.scene, name, {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
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

    const transformComponent = getGameObjectTransform(this.building);
    if (!transformComponent) return;

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

    transformComponent.x = worldPosition.x;
    transformComponent.y = worldPosition.y;

    DepthHelper.setActorDepth(this.building);

    this.clearGraphics();
    if (!this.isDragging) {
      this.drawPlacementGrid(worldPosition);
      this.drawAttackRange(worldPosition);
    }

    // if dragging, then tint spawnedCursorGameObjects and set to semi-transparent, if not dragging, do this for building
    const tint = this.canConstructBuildingAt(worldPosition) ? undefined : 0xff0000;
    const gameObjects = this.isDragging ? this.spawnedCursorGameObjects : [this.building!];
    for (const gameObject of gameObjects) {
      const constructionGameObjectInterfaceComponent = getActorComponent(
        gameObject,
        ConstructionGameObjectInterfaceComponent
      );
      if (!constructionGameObjectInterfaceComponent) continue;
      constructionGameObjectInterfaceComponent.tintAndAlphaCursor(tint, 0.7);
    }
  }

  canConstructBuildingAt(location: Vector2Simple): boolean {
    return true; // todo Replace with actual placement check.
  }

  private drawPlacementGrid(location: Vector2Simple) {
    if (!location || !this.building) return;

    const bounds = getGameObjectBounds(this.building);
    if (!bounds) return;

    const gridGraphics = this.scene.add.graphics();
    const tileSize = this.tileSize;
    const xPos = location.x;
    const yPos = location.y;

    const canConstruct = this.canConstructBuildingAt(location);

    gridGraphics.lineStyle(2, canConstruct ? 0x00ff00 : 0xff0000, 1);
    gridGraphics.fillStyle(canConstruct ? 0x00ff00 : 0xff0000, 0.3);

    function moveLineTo(isoX: number, isoY: number) {
      gridGraphics.moveTo(isoX, isoY - tileSize / 4);
      gridGraphics.lineTo(isoX + tileSize / 2, isoY);
      gridGraphics.lineTo(isoX, isoY + tileSize / 4);
      gridGraphics.lineTo(isoX - tileSize / 2, isoY);
    }

    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        const isoX = xPos + (i - j) * (tileSize / 2);
        const isoY = yPos + (i + j) * (tileSize / 4);

        if (Math.abs(i) > 2 || Math.abs(j) > 2) {
          moveLineTo(isoX, isoY);
          gridGraphics.closePath();
          gridGraphics.stroke();
        } else {
          gridGraphics.beginPath();
          moveLineTo(isoX, isoY);
          gridGraphics.closePath();
          gridGraphics.fillPath();
        }
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
  }

  private placeBuildings() {
    this.allCellsAreValid = true; // Placeholder logic

    if (this.spawnedCursorGameObjects.length) {
      this.building?.destroy();
      for (const gameObject of this.spawnedCursorGameObjects) {
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
    this.isDragging = false;
  }

  private spawnConstructionSite(gameObject: GameObjects.GameObject) {
    const currentPlayer = getCurrentPlayerNumber(this.scene);
    const actorDefinition = {
      ...(currentPlayer && { owner: currentPlayer })
    } satisfies ActorDefinition;

    upgradeFromCoreToConstructingActorData(gameObject, actorDefinition);
    // todo Save to game state
  }

  private subscribeToCancelAction() {
    this.escKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    if (!this.escKey) return;
    this.escKey.on(Phaser.Input.Keyboard.Events.DOWN, this.stop, this);
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
    this.startPlacingSubscription.unsubscribe();
    this.stopPlacingSubscription.unsubscribe();
  }
}
