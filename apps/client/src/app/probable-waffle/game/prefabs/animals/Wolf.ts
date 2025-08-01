// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { AudioActorComponent } from "../../entity/actor/components/audio-actor-component";
import { AnimationActorComponent } from "../../entity/actor/components/animation-actor-component";
import { getActorComponent } from "../../data/actor-component";
import { moveGameObjectToRandomTileInNavigableRadius, MovementSystem } from "../../entity/systems/movement.system";
import { getActorSystem } from "../../data/actor-system";
import { onObjectReady } from "../../data/game-object-helper";
/* END-USER-IMPORTS */

export default class Wolf extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 44.63423422034173, texture || "animals_2", frame ?? "wolf/idle/se/04.png");

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 17.728843673401734), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.631606606461893);
    this.play("wolf/idle/se");

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Wolf;
  private actorAudioComponent?: AudioActorComponent;
  private animationActorComponent?: AnimationActorComponent;
  private readonly radius = 2;
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private curledUp = false;

  private postSceneCreate() {
    this.actorAudioComponent = getActorComponent(this, AudioActorComponent);
    this.animationActorComponent = getActorComponent(this, AnimationActorComponent);
    this.moveAfterDelay();
    this.handleClick();
  }

  private handleClick() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onClick, this);
  }

  private onClick() {
    // todo
  }

  async move() {
    if (!this.active) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius);
      this.moveAfterDelay();
    } catch (e) {
      console.error(e);
    }
  }

  private moveAfterDelay() {
    if (!this.active) return;
    if (this.curledUp) return;
    this.removeDelay();
    const randomDelay = Phaser.Math.Between(1000, 5000);
    this.currentDelay = this.scene.time.delayedCall(randomDelay, this.move, [], this);
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
