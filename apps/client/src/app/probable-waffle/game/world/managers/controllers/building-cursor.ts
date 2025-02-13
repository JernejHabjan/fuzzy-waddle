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
    const snap = this.tileSize / 2;
    const snapX = Math.round(worldPosition.x / snap) * snap;
    const snapY = Math.round(worldPosition.y / snap) * snap;

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

  private drawLineBetweenPoints() {
    if (!this.downPointerLocation || !this.pointerLocation) return;

    const snappedDownPointer = this.snapToGrid(new Vector2(this.downPointerLocation.x, this.downPointerLocation.y));
    const snappedPointer = this.snapToGrid(new Vector2(this.pointerLocation.x, this.pointerLocation.y));

    let x = snappedDownPointer.x;
    let y = snappedDownPointer.y;

    let dx = snappedPointer.x - snappedDownPointer.x;
    let dy = snappedPointer.y - snappedDownPointer.y;

    const steps = Math.abs(dx / this.tileSize) + Math.abs(dy / this.tileSize);

    for (let i = 0; i < steps; i++) {
      if (Math.abs(dx) > Math.abs(dy)) {
        x += Math.sign(dx) * this.tileSize;
        dx -= Math.sign(dx) * this.tileSize;
      } else {
        y += Math.sign(dy) * this.tileSize;
        dy -= Math.sign(dy) * this.tileSize;
      }

      this.spawnCursorGameObjectAt(x, y);
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
