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
import Vector2 = Phaser.Math.Vector2;

export class BuildingCursor {
  placementGrid?: GameObjects.Graphics;
  allCellsAreValid = false;
  private building?: GameObjects.GameObject;
  private pointerLocation?: Vector2Simple;
  private attackRangeCircle?: GameObjects.Graphics;
  startPlacingBuilding = new EventEmitter<ObjectNames>();
  stopPlacingBuilding = new EventEmitter<void>();

  private readonly tileSize = 64;
  private readonly startPlacingSubscription: Subscription;
  private readonly stopPlacingSubscription: Subscription;
  private escKey: Phaser.Input.Keyboard.Key | undefined;
  private downPointerLocation?: Vector2Simple;
  private spawnedCursorGameObjects: GameObjects.GameObject[] = [];
  private isDragging: boolean = false;

  constructor(private scene: GameProbableWaffleScene) {
    this.startPlacingSubscription = this.startPlacingBuilding.subscribe((name) => this.spawn(name));
    this.stopPlacingSubscription = this.stopPlacingBuilding.subscribe(() => this.stop());
    this.scene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.on(Input.Events.POINTER_UP, this.onPointerUp, this);
    scene.onShutdown.subscribe(() => this.destroy());
    this.subscribeToCancelAction();
  }

  private spawn(name: ObjectNames) {
    if (this.building) this.stop();

    const pointer = this.scene.input.activePointer;
    let worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    worldPosition = this.snapToGrid(worldPosition);

    const actor = ActorManager.createActorCore(this.scene, name, {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
    } satisfies ActorDefinition);

    const gameObject = this.scene.add.existing(actor);

    this.building = gameObject;
    this.pointerLocation = worldPosition;

    if (!this.isDragging) {
      this.drawPlacementGrid(worldPosition);
      this.drawAttackRange(worldPosition);
    }
  }

  private handlePointerMove(pointer: Input.Pointer) {
    if (this.downPointerLocation) {
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
    if (this.downPointerLocation) {
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
  }

  canConstructBuildingAt(location: Vector2Simple): boolean {
    return true; // Replace with actual placement check.
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
    const snapByX = this.tileSize / 2;
    const snapByY = this.tileSize / 4;
    const snapX = Math.round(worldPosition.x / snapByX) * snapByX;
    const snapY = Math.round(worldPosition.y / snapByY) * snapByY;

    return new Vector2(snapX, snapY);
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

    const rangeRadiusX = primaryAttack.range;
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
    this.downPointerLocation = undefined;
    this.isDragging = false;
  }

  private lineGraphics?: GameObjects.Graphics;
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
    const snappedMidpoint = this.snapToGrid(new Vector2(midpointX, midpointY));
    midpointX = snappedMidpoint.x;
    midpointY = snappedMidpoint.y;

    const lineGraphics = this.lineGraphics || this.scene.add.graphics();
    this.lineGraphics = lineGraphics;
    lineGraphics.clear();
    lineGraphics.lineStyle(2, 0xff0000, 1);

    // Draw the path
    lineGraphics.moveTo(startX, startY);
    lineGraphics.lineTo(midpointX, midpointY);
    lineGraphics.lineTo(endX, endY);

    lineGraphics.strokePath();

    // Spawn preview buildings along the path
    this.clearSpawnedCursorGameObjects();

    // Calculate the number of steps needed based on tile size
    const dx = endX - startX;
    const dy = endY - startY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy)) / (this.tileSize / 2);

    // Spawn buildings along the path
    for (let i = 0; i <= steps; i++) {
      let t = i / steps;
      let x, y;

      if (t <= 0.5) {
        // First half of the path (start to midpoint)
        t = t * 2;
        x = startX + (midpointX - startX) * t;
        y = startY + (midpointY - startY) * t;
      } else {
        // Second half of the path (midpoint to end)
        t = (t - 0.5) * 2;
        x = midpointX + (endX - midpointX) * t;
        y = midpointY + (endY - midpointY) * t;
      }

      const snappedPoint = this.snapToGrid(new Vector2(x, y));
      this.spawnCursorGameObjectAt(snappedPoint.x, snappedPoint.y);
    }
  }

  private spawnCursorGameObjectAt(x: number, y: number) {
    const actor = ActorManager.createActorCore(this.scene, this.building!.name as ObjectNames, { x, y, z: 0 });
    const gameObject = this.scene.add.existing(actor);
    this.spawnedCursorGameObjects.push(gameObject);

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

    for (const gameObject of this.spawnedCursorGameObjects) {
      this.building = gameObject;
      this.spawnConstructionSite();
    }

    this.building = undefined;
    this.pointerLocation = undefined;
    this.allCellsAreValid = false;
    this.clearGraphics();
    this.clearSpawnedCursorGameObjects();
  }

  private spawnConstructionSite() {
    if (!this.building) return;

    const currentPlayer = getCurrentPlayerNumber(this.scene);
    const actorDefinition = {
      ...(currentPlayer && { owner: currentPlayer })
    } satisfies ActorDefinition;

    upgradeFromCoreToConstructingActorData(this.building, actorDefinition);
    // Save to game state
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
  }

  private destroy() {
    this.stop();
    this.scene.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Input.Events.POINTER_UP, this.onPointerUp, this);
    this.escKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.stop, this);
    this.startPlacingSubscription.unsubscribe();
    this.stopPlacingSubscription.unsubscribe();
  }
}
