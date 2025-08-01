// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { moveGameObjectToRandomTileInNavigableRadius, MovementSystem } from "../../entity/systems/movement.system";
import { getActorSystem } from "../../data/actor-system";
import { onObjectReady } from "../../data/game-object-helper";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../data/actor-component";
import { AudioActorComponent, SoundType } from "../../entity/actor/components/audio-actor-component";
import { AnimationActorComponent } from "../../entity/actor/components/animation-actor-component";
/* END-USER-IMPORTS */

export default class Hedgehog extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 21.596080279718947, texture || "animals", frame ?? "hedgehog/10.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 11.323425464509395), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6748775087412171);

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Hedgehog;
  private actorAudioComponent?: AudioActorComponent;
  private animationActorComponent?: AnimationActorComponent;
  private readonly radius = 2;
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private curledUp = false;

  private postSceneCreate() {
    this.actorAudioComponent = getActorComponent(this, AudioActorComponent);
    this.animationActorComponent = getActorComponent(this, AnimationActorComponent);
    this.moveHedgehogAfterDelay();
    this.handleClick();
  }

  private handleClick() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onClick, this);
  }

  private onClick() {
    this.curlUp();
  }

  async moveHedgehog() {
    if (!this.active) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius);
      this.moveHedgehogAfterDelay();
    } catch (e) {
      console.error(e);
    }
  }

  private curlUp() {
    if (!this.active) return;
    if (this.curledUp) return;
    this.removeDelay();
    this.cancelMovement();

    this.curledUp = true;

    this.animationActorComponent?.playCustomAnimation("ball", {
      onComplete: () => {
        this.curledUp = false;
        this.moveHedgehogAfterDelay();
      }
    });
    const sound = Math.random() < 0.8 ? SoundType.Select : SoundType.SelectExtra;
    this.actorAudioComponent?.playSpatialCustomSound(sound);
  }

  private moveHedgehogAfterDelay() {
    if (!this.active) return;
    if (this.curledUp) return;
    this.removeDelay();
    const randomDelay = Phaser.Math.Between(1000, 5000);
    this.currentDelay = this.scene.time.delayedCall(randomDelay, this.moveHedgehog, [], this);
  }

  private removeDelay() {
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }

  private cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.off(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onClick, this);
    this.removeDelay();
    this.cancelMovement();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
