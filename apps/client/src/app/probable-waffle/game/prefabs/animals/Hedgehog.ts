// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { moveGameObjectToRandomTileInNavigableRadius, MovementSystem } from "../../entity/systems/movement.system";
import { getActorSystem } from "../../data/actor-system";
import { onObjectReady } from "../../data/game-object-helper";
import { ObjectNames } from "../../data/object-names";
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
    this.moveHedgehogAfterDelay(4000);
  }

  async moveHedgehog() {
    if (!this.active) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius);
    } catch (e) {
      console.error(e);
    }
  }

  private curlUp() {
    if (!this.active) return;
    this.removeDelay();
    this.cancelMovement();

    this.animationActorComponent?.playCustomAnimation("ball");
    const sound = Math.random() < 0.8 ? SoundType.Select : SoundType.SelectExtra;
    this.actorAudioComponent?.playSpatialCustomSound(sound);
  }

  private moveHedgehogAfterDelay(additionalDelay: number = 0) {
    if (!this.active) return;
    this.removeDelay();
    const randomDelay = Phaser.Math.Between(1000, 5000) + additionalDelay;
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
