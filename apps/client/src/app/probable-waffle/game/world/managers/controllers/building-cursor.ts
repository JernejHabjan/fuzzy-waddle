import { GameObjects, Input } from "phaser";
import { ActorDefinition, Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { ActorManager } from "../../../data/actor-manager";
import { ObjectNames } from "../../../data/object-names";
import { getGameObjectBounds, getGameObjectTransform } from "../../../data/game-object-helper";
import { DepthHelper } from "../../map/depth.helper";
import { pwActorDefinitions } from "../../../data/actor-definitions";
import { upgradeFromMandatoryToFullActorData } from "../../../data/actor-data";
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
  constructor(private scene: GameProbableWaffleScene) {
    this.startPlacingSubscription = this.startPlacingBuilding.subscribe((name) => this.spawn(name));
    this.stopPlacingSubscription = this.stopPlacingBuilding.subscribe(() => this.stop());
    this.scene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.on(Input.Events.POINTER_DOWN, this.placeBuilding, this);
    scene.onShutdown.subscribe(() => this.destroy());
    this.subscribeToCancelAction();
  }

  private spawn(name: ObjectNames) {
    if (this.building) this.stop();

    const pointer = this.scene.input.activePointer;
    let worldPosition = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    worldPosition = this.snapToGrid(worldPosition);

    const actor = ActorManager.createActorPartially(this.scene, name, {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
    } satisfies ActorDefinition);

    // noinspection UnnecessaryLocalVariableJS
    const gameObject = this.scene.add.existing(actor);

    this.building = gameObject;
    this.pointerLocation = worldPosition;

    this.drawPlacementGrid();
    this.drawAttackRange();
  }

  private handlePointerMove(pointer: Input.Pointer) {
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

    transformComponent.x = worldPosition.x;
    transformComponent.y = worldPosition.y;

    DepthHelper.setActorDepth(this.building);

    // Clear the previous graphics before drawing the new ones
    this.clearGraphics();

    this.drawPlacementGrid();
    this.drawAttackRange();
  }

  canConstructBuildingAt(location: Vector2Simple): boolean {
    // Placeholder logic, assuming building placement is always valid.
    return true; // Replace with actual placement check.
  }

  private drawPlacementGrid() {
    if (!this.pointerLocation || !this.building) return;

    const bounds = getGameObjectBounds(this.building);
    if (!bounds) return;

    const gridGraphics = this.scene.add.graphics();
    const tileSize = this.tileSize;
    const xPos = this.pointerLocation.x;
    const yPos = this.pointerLocation.y;

    // Check if building can be placed here
    const canConstruct = this.canConstructBuildingAt(this.pointerLocation);

    // Set grid line color based on whether placement is valid
    gridGraphics.lineStyle(2, canConstruct ? 0x00ff00 : 0xff0000, 1); // Green if valid, red if invalid

    // Set fill color to green for valid placement and semi-transparent
    gridGraphics.fillStyle(canConstruct ? 0x00ff00 : 0xff0000, 0.3); // Semi-transparent fill

    function moveLineTo(isoX: number, isoY: number) {
      gridGraphics.moveTo(isoX, isoY - tileSize / 4);
      gridGraphics.lineTo(isoX + tileSize / 2, isoY);
      gridGraphics.lineTo(isoX, isoY + tileSize / 4);
      gridGraphics.lineTo(isoX - tileSize / 2, isoY);
    }

    // Draw isometric grid
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        // Calculate isometric coordinates
        const isoX = xPos + (i - j) * (tileSize / 2);
        const isoY = yPos + (i + j) * (tileSize / 4);

        // Skip outer 3 tiles for filling (only outline them)
        if (Math.abs(i) > 2 || Math.abs(j) > 2) {
          // Outline only the outer tiles
          moveLineTo(isoX, isoY);
          gridGraphics.closePath();
          gridGraphics.stroke();
        } else {
          // Fill the inner tiles (under the building)
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

  private drawAttackRange() {
    if (!this.pointerLocation || !this.building) return;

    const definition = pwActorDefinitions[this.building.name as ObjectNames];
    if (!definition) return;

    const attackDefinition = definition.components?.attack;
    if (!attackDefinition || !attackDefinition.attacks.length) return;

    // Clear previous attack range ellipse if it exists
    if (this.attackRangeCircle) {
      this.attackRangeCircle.clear();
    }

    const primaryAttack = attackDefinition.attacks[0];

    const rangeRadiusX = primaryAttack.range;
    const rangeRadiusY = rangeRadiusX / 2;
    const attackRangeGraphics = this.scene.add.graphics();
    attackRangeGraphics.lineStyle(2, 0xff0000, 1); // Red color for the attack range

    const xPos = this.pointerLocation.x;
    const yPos = this.pointerLocation.y;

    // Draw the ellipse to represent the attack range in isometric perspective
    attackRangeGraphics.strokeEllipse(xPos, yPos, rangeRadiusX, rangeRadiusY);

    this.attackRangeCircle = attackRangeGraphics;
  }

  private clearGraphics() {
    // Clear the previous graphics (grid and attack range)
    if (this.placementGrid) {
      this.placementGrid.clear();
    }
    if (this.attackRangeCircle) {
      this.attackRangeCircle.clear();
    }
  }

  private placeBuilding() {
    if (!this.pointerLocation || !this.building) return;

    // Placeholder logic, assuming building placement is always valid.
    this.allCellsAreValid = true; // todo Replace with actual placement check.

    // Save the building to the game state
    this.fullySpawnBuilding();

    // Reset the building cursor
    this.building = undefined;
    this.pointerLocation = undefined;
    this.allCellsAreValid = false;
    this.clearGraphics();
  }

  private fullySpawnBuilding() {
    if (!this.building) return;

    upgradeFromMandatoryToFullActorData(this.building);

    const currentPlayer = getCurrentPlayerNumber(this.scene);
    ActorManager.setActorProperties(this.building, {
      ...(currentPlayer && { owner: currentPlayer })
    } satisfies ActorDefinition);
    // todo save to game state
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
    this.clearGraphics();
  }

  private destroy() {
    this.stop();
    this.scene.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.scene.input.off(Input.Events.POINTER_DOWN, this.placeBuilding, this);
    this.escKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.stop, this);
    this.startPlacingSubscription.unsubscribe();
    this.stopPlacingSubscription.unsubscribe();
  }
}
