// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { AnimationActorComponent, AnimationOptions } from "../../entity/actor/components/animation-actor-component";
import { getActorComponent } from "../../data/actor-component";
import {
  getRandomTileInNavigableRadius,
  moveGameObjectToRandomTileInNavigableRadius,
  MovementSystem,
  PathMoveConfig
} from "../../entity/systems/movement.system";
import { getActorSystem } from "../../data/actor-system";
import { onObjectReady } from "../../data/game-object-helper";
import { ActorTranslateComponent } from "../../entity/actor/components/actor-translate-component";
import { OrderType } from "../../entity/character/ai/order-type";
/* END-USER-IMPORTS */

export default class Badger extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 21, y ?? 19.84684741722598, texture || "animals_2", frame ?? "badger/idle/se/00.png");

    this.setInteractive(new Phaser.Geom.Ellipse(21, 16, 42, 32), Phaser.Geom.Ellipse.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.5801426545255413);
    this.play("badger/idle/se");

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Badger;

  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private movementSystem?: MovementSystem;
  private readonly radius = 5;
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private tunneling = false;

  private postSceneCreate() {
    this.animationActorComponent = getActorComponent(this, AnimationActorComponent);
    this.actorTranslateComponent = getActorComponent(this, ActorTranslateComponent);
    this.movementSystem = getActorSystem(this, MovementSystem);

    this.moveAfterDelay();
    this.handleClick();
  }

  private handleClick() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onClick, this);
  }

  private onClick() {
    this.burrowAndTunnel();
  }

  async move() {
    if (!this.active) return;
    if (this.tunneling) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius);
      this.moveAfterDelay();
    } catch (e) {
      console.error(e);
    }
  }

  private burrowAndTunnel() {
    if (!this.active) return;
    if (this.tunneling) return;
    this.removeDelay();
    this.cancelMovement();

    this.tunneling = true;

    this.burrow();
  }

  private burrow() {
    // todo play burrow sound
    this.animationActorComponent?.playCustomAnimation("burrow", {
      onComplete: async () => await this.tunnel()
    } satisfies AnimationOptions);
  }

  private async tunnel() {
    if (!this.active) return;

    const tileXY = await getRandomTileInNavigableRadius(this, this.radius);
    if (!tileXY) return;
    this.actorTranslateComponent?.turnTowardsTile(tileXY);

    // todo play tunnel sound
    this.animationActorComponent?.playCustomAnimation("tunnel");

    this.movementSystem
      ?.moveToLocationByFollowingStaticPath({ x: tileXY.x, y: tileXY.y, z: 0 }, {
        ignoreAnimations: true // we're overriding move animations here
      } satisfies PathMoveConfig)
      .then((success) => {
        if (!success || !this.active) return;
        this.unburrow();
      });
  }

  private unburrow() {
    if (!this.active) return;
    // todo play unburrow sound
    this.animationActorComponent?.playCustomAnimation("unburrow", {
      onComplete: () => {
        if (!this.active) return;
        this.animationActorComponent?.playOrderAnimation(OrderType.Stop);
        this.tunneling = false;

        this.moveAfterDelay();
      }
    } satisfies AnimationOptions);
  }

  private moveAfterDelay() {
    if (!this.active) return;
    if (this.tunneling) return;
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
