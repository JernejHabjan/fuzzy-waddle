// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

import { getActorSystem } from "../../../data/actor-system";
import { MovementSystem } from "../../../entity/systems/movement.system";
import { type RallyPointComponentData, type Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { GameObjects } from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { SelectableComponent } from "../../../entity/components/selectable-component";
import { Subscription } from "rxjs";
import {
  getGameObjectCurrentTile,
  getGameObjectLogicalTransform,
  getGameObjectRenderedTransform
} from "../../../data/game-object-helper";
import { SharedActorActionsRallyPointSound } from "../../../sfx/shared-actor-actions-sfx";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import { IdComponent } from "../../../entity/components/id-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { ActorTranslateComponent } from "../../../entity/components/movement/actor-translate-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import GameObject = Phaser.GameObjects.GameObject;

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
  public tileVec3?: Vector3Simple = undefined;
  public worldVec3?: Vector3Simple = undefined;
  // Actor to send new actors to
  public actor?: GameObject = undefined;

  private selectionChangedSubscription?: Subscription;
  private ownerMovedSubscription?: Subscription;
  private targetMovedSubscription?: Subscription;
  private targetDepletedSubscription?: Subscription;
  private selectionComponent: SelectableComponent | undefined;
  private audioService?: AudioService;

  init(owner: GameObjects.GameObject) {
    this.owner = owner;

    this.owner.scene.add.existing(this);
    this.lineGraphics = this.scene.add.graphics();
    this.lineGraphics.visible = false;

    this.setDepth(this.drawDepth);
    this.lineGraphics.setDepth(this.drawDepth);

    this.selectionComponent = getActorComponent(owner, SelectableComponent);
    if (this.selectionComponent) {
      this.selectionChangedSubscription = this.selectionComponent.selectionChanged.subscribe(() => {
        this.handleVisibility();
      });
    }
    this.ownerMovedSubscription = getActorComponent(owner, ActorTranslateComponent)?.actorMovedLogicalPosition.subscribe(
      () => this.drawLine()
    );
    this.audioService = getSceneService(owner.scene, AudioService);
  }

  private handleVisibility() {
    const selected = this.selectionComponent?.getSelected();
    this.visible = !!(selected && this.isSet());
    this.lineGraphics?.setVisible(this.visible);
    this.drawLine();
  }

  async navigateGameObjectToRallyPoint(newGameObject: Phaser.GameObjects.GameObject) {
    const movementSystem = getActorSystem<MovementSystem>(newGameObject, MovementSystem);
    if (!movementSystem) return;
    if (this.tileVec3) {
      const tileVec3 = (await movementSystem.getClosestUnoccupiedTileVec3(this.tileVec3)) ?? this.tileVec3;
      await movementSystem.moveToLocationByFollowingStaticPath(tileVec3);
      return;
    }
    if (this.actor) {
      await movementSystem.moveToActorByAdjustingPathDynamically(this.actor);
    }
  }

  /* END-USER-CODE */
  setLocation(tileVec3: Vector3Simple, worldVec3: Vector3Simple) {
    this.clearActorTargetSubscriptions();
    this.tileVec3 = tileVec3;
    this.worldVec3 = worldVec3;
    this.actor = undefined;
    this.x = worldVec3.x;
    this.y = worldVec3.y;
    this.z = worldVec3.z;
    this.handleVisibility();
    this.playRallyPointSetSound();
  }

  setActor(gameObject: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform) {
    this.clearActorTargetSubscriptions();
    this.actor = gameObject;
    this.tileVec3 = undefined;
    this.worldVec3 = undefined;
    this.updatePositionFromActor();
    this.subscribeToActorTarget(gameObject);
    this.handleVisibility();
    this.playRallyPointSetSound();
  }

  isSet() {
    return this.tileVec3 || this.actor;
  }

  getTargetGameObject() {
    return this.actor;
  }

  getTargetTileVec3() {
    if (this.tileVec3) return this.tileVec3;
    if (!this.actor) return undefined;
    const tile = getGameObjectCurrentTile(this.actor);
    if (!tile) return undefined;
    return { x: tile.x, y: tile.y, z: 0 } satisfies Vector3Simple;
  }

  /**
   * draws a dashed line from the rally point to the actor
   */
  private drawLine() {
    if (!this.owner) return;
    if (!this.lineGraphics) return;
    if (!this.visible) return;
    const ownerTransform = getGameObjectRenderedTransform(this.owner);
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

  getRallyData() {
    return {
      tileVec3: this.tileVec3,
      worldVec3: this.worldVec3,
      actorId: this.actor ? getActorComponent(this.actor, IdComponent)!.id : undefined
    } satisfies RallyPointComponentData;
  }

  setRallyData(data: Partial<RallyPointComponentData>) {
    if (data.tileVec3 && data.worldVec3) {
      this.setLocation(data.tileVec3, data.worldVec3);
    } else if (data.actorId) {
      const actorIndex = getSceneService(this.scene, ActorIndexSystem);
      const actor = actorIndex?.getActorById(data.actorId);
      if (actor) {
        this.setActor(actor as any);
      } else {
        this.reset();
      }
    } else {
      this.reset();
    }
  }

  reset() {
    this.clearActorTargetSubscriptions();
    this.tileVec3 = undefined;
    this.worldVec3 = undefined;
    this.actor = undefined;
    this.visible = false;
    this.lineGraphics?.clear();
    this.lineGraphics?.setVisible(false);
  }

  private subscribeToActorTarget(gameObject: Phaser.GameObjects.GameObject) {
    this.targetMovedSubscription = getActorComponent(gameObject, ActorTranslateComponent)?.actorMovedLogicalPosition.subscribe(
      () => {
        this.updatePositionFromActor();
        this.handleVisibility();
      }
    );
    this.targetDepletedSubscription = getActorComponent(gameObject, ResourceSourceComponent)?.onDepleted.subscribe(() =>
      this.reset()
    );
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.reset, this);
    gameObject.once(HealthComponent.KilledEvent, this.reset, this);
    gameObject.once(OwnerComponent.OwnerChangedEvent, this.reset, this);
  }

  private updatePositionFromActor() {
    if (!this.actor) return;
    const renderedTransform = getGameObjectRenderedTransform(this.actor);
    const logicalTransform = getGameObjectLogicalTransform(this.actor);
    if (!renderedTransform) return;
    this.x = renderedTransform.x;
    this.y = renderedTransform.y;
    this.z = logicalTransform?.z ?? 0;
  }

  private clearActorTargetSubscriptions() {
    if (this.actor) {
      this.actor.off(Phaser.GameObjects.Events.DESTROY, this.reset, this);
      this.actor.off(HealthComponent.KilledEvent, this.reset, this);
      this.actor.off(OwnerComponent.OwnerChangedEvent, this.reset, this);
    }
    this.targetMovedSubscription?.unsubscribe();
    this.targetMovedSubscription = undefined;
    this.targetDepletedSubscription?.unsubscribe();
    this.targetDepletedSubscription = undefined;
  }

  override destroy(fromScene?: boolean) {
    this.clearActorTargetSubscriptions();
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
    this.ownerMovedSubscription?.unsubscribe();
    this.lineGraphics?.destroy();
  }
}

/* END OF COMPILED CODE */

// You can write more code here
