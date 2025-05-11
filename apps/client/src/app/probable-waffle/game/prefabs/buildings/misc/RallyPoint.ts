// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { getActorSystem } from "../../../data/actor-system";
import { MovementSystem } from "../../../entity/systems/movement.system";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { GameObjects } from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { Subscription } from "rxjs";
import { getGameObjectTransform } from "../../../data/game-object-helper";
import GameObject = Phaser.GameObjects.GameObject;
import { SharedActorActionsRallyPointSound } from "../../../sfx/SharedActorActionsSfx";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { AudioService } from "../../../scenes/services/audio.service";

export default class RallyPoint extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 11, y ?? 32, texture || "factions", frame ?? "buildings/misc/rally.png");

    this.setOrigin(0.5, 1);

    /* START-USER-CTR-CODE */
    this.visible = false;

    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private readonly drawDepth = 100000;
  private lineGraphics?: Phaser.GameObjects.Graphics;
  private owner: GameObject | null = null;
  // Location to send new actors to
  public tileVec3?: Vector3Simple | null = null;
  public worldVec3?: Vector3Simple | null = null;
  // Actor to send new actors to
  public actor?: GameObject | null = null;

  private selectionChangedSubscription?: Subscription;
  private selectionComponent: SelectableComponent | undefined;
  private audioService?: AudioService;

  init(owner: GameObjects.GameObject) {
    this.owner = owner;

    this.owner.scene.add.existing(this);
    this.lineGraphics = this.scene.add.graphics();
    this.lineGraphics.visible = false;

    this.setDepth(this.drawDepth);
    this.lineGraphics.setDepth(this.drawDepth);

    this.selectionComponent = getActorComponent(this.owner, SelectableComponent);
    if (this.selectionComponent) {
      this.selectionChangedSubscription = this.selectionComponent.selectionChanged.subscribe(() => {
        this.handleVisibility();
      });
    }
    this.audioService = getSceneService(this.owner.scene, AudioService);
  }

  private handleVisibility() {
    const selected = this.selectionComponent?.getSelected();
    this.visible = !!(selected && this.isSet());
    this.lineGraphics?.setVisible(this.visible);
    this.drawLine();
  }

  navigateGameObjectToRallyPoint(newGameObject: Phaser.GameObjects.GameObject) {
    const movementSystem = getActorSystem<MovementSystem>(newGameObject, MovementSystem);
    if (!movementSystem) return;
    if (this.tileVec3) {
      // noinspection JSIgnoredPromiseFromCall
      movementSystem.moveToLocation(this.tileVec3);
      return;
    }
    if (this.actor) {
      // noinspection JSIgnoredPromiseFromCall
      movementSystem.moveToActor(this.actor);
    }
  }

  /* END-USER-CODE */
  setLocation(tileVec3: Vector3Simple, worldVec3: Vector3Simple) {
    this.tileVec3 = tileVec3;
    this.worldVec3 = worldVec3;
    this.actor = null;
    this.x = worldVec3.x;
    this.y = worldVec3.y;
    this.z = worldVec3.z;
    this.handleVisibility();
    this.playRallyPointSetSound();
  }

  setActor(gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform) {
    this.actor = gameObject;
    this.tileVec3 = null;
    this.worldVec3 = null;
    this.x = gameObject.x;
    this.y = gameObject.y;
    this.z = gameObject.z;
    this.handleVisibility();
  }

  isSet() {
    return this.tileVec3 || this.actor;
  }

  /**
   * draws a dashed line from the rally point to the actor
   */
  private drawLine() {
    if (!this.owner) return;
    if (!this.lineGraphics) return;
    if (!this.visible) return;
    const ownerTransform = getGameObjectTransform(this.owner);
    if (!ownerTransform) return;

    this.lineGraphics.clear();
    this.lineGraphics.lineStyle(2, 0x000000, 1);

    const startX = this.x;
    const startY = this.y;
    const endX = ownerTransform.x;
    const endY = ownerTransform.y;

    const dashLength = 10;
    const gapLength = 5;
    const totalLength = Phaser.Math.Distance.Between(startX, startY, endX, endY);

    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);

    let currentLength = 0;
    while (currentLength < totalLength) {
      const segmentStartX = startX + Math.cos(angle) * currentLength;
      const segmentStartY = startY + Math.sin(angle) * currentLength;
      const segmentEndX = startX + Math.cos(angle) * Math.min(currentLength + dashLength, totalLength);
      const segmentEndY = startY + Math.sin(angle) * Math.min(currentLength + dashLength, totalLength);

      this.lineGraphics.beginPath();
      this.lineGraphics.moveTo(segmentStartX, segmentStartY);
      this.lineGraphics.lineTo(segmentEndX, segmentEndY);
      this.lineGraphics.strokePath();

      currentLength += dashLength + gapLength;
    }
  }

  private playRallyPointSetSound() {
    if (!this.audioService) return;
    const sound = SharedActorActionsRallyPointSound;
    this.audioService.playSpatialAudioSprite(this, sound.key, sound.spriteName);
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
    this.lineGraphics?.destroy();
  }
}

/* END OF COMPILED CODE */

// You can write more code here
