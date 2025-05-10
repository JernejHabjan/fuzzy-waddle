// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { moveGameObjectToRandomTileInNavigableRadius, MovementSystem } from "../../entity/systems/movement.system";
import { onObjectReady } from "../../data/game-object-helper";
import { getActorSystem } from "../../data/actor-system";
import { ObjectNames } from "../../data/object-names";
import { getActorComponent } from "../../data/actor-component";
import { AudioActorComponent, SoundType } from "../../entity/actor/components/audio-actor-component";
import { AnimationActorComponent } from "../../entity/actor/components/animation-actor-component";
import { OrderType } from "../../entity/character/ai/order-type";
/* END-USER-IMPORTS */

export default class Sheep extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 49.42203448546586, texture || "animals", frame ?? "sheep/sheep_down.png");

    this.setInteractive(new Phaser.Geom.Circle(29, 39, 17.805288050449516), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.772219288835404);
    this.play("sheep_idle_down");

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.postSceneCreate, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Sheep;

  private postSceneCreate() {
    this.actorAudioComponent = getActorComponent(this, AudioActorComponent);
    this.animationActorComponent = getActorComponent(this, AnimationActorComponent);
    this.handleWoolParticles(this.scene);
    this.on(Phaser.Input.Events.POINTER_DOWN, this.onClick, this);
    this.moveSheepAfterDelay();
  }

  private actorAudioComponent?: AudioActorComponent;
  private animationActorComponent?: AnimationActorComponent;
  private readonly radius = 2;
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private woolParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sheared = false;
  private shearedCount = 0;
  private readonly maxShearedCount = 5;

  private handleWoolParticles(scene: Phaser.Scene) {
    // Add wool particle emitter to the scene
    this.woolParticles = scene.add.particles(0, 0, "animals", {
      frame: ["sheep/effects/wool_1.png", "sheep/effects/wool_2.png"],
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      quantity: 1,
      gravityY: 50,
      scale: { start: 2, end: 1 },
      rotate: { start: 0, end: 360 },
      frequency: 1,
      emitting: false
    });
  }

  private onClick() {
    this.cancelMovement();
    if (this.shearedCount < this.maxShearedCount) {
      this.woolParticles?.emitParticleAt(this.x, this.y - 25, Phaser.Math.Between(1, 4));
      this.actorAudioComponent?.playSpatialCustomSound("scissors");
    }
    this.shearedCount++;
    if (this.shearedCount === this.maxShearedCount) {
      this.setSheared();
    } else {
      this.moveSheepAfterDelay();
    }
  }

  private setSheared() {
    this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
    this.actorAudioComponent?.playSpatialCustomSound("wool");
    this.actorAudioComponent?.playSpatialCustomSound(SoundType.Select);
    this.sheared = true;
    this.animationActorComponent?.playCustomAnimation("sheared");
    // start timer to reset sheep
    this.scene.time.delayedCall(5000, () => {
      this.shearedCount = 0;
      this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
      this.actorAudioComponent?.playSpatialCustomSound("wool");
      this.sheared = false;
      this.animationActorComponent?.playOrderAnimation(OrderType.Stop);
      this.moveSheepAfterDelay();
    });
  }

  private async startMovement() {
    if (!this.active) return;
    if (this.sheared) return;
    try {
      await moveGameObjectToRandomTileInNavigableRadius(this, this.radius);
    } catch (e) {
      console.error(e);
    }
    this.moveSheepAfterDelay();
  }

  private moveSheepAfterDelay() {
    if (!this.active) return;
    if (this.sheared) return;
    this.removeDelay();
    const randomDelay = Phaser.Math.Between(1000, 5000);
    this.currentDelay = this.scene.time.delayedCall(randomDelay, this.startMovement, [], this);
  }

  setDepth(value: number): this {
    this.woolParticles?.setDepth(value + 1);
    return super.setDepth(value);
  }

  private cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  private removeDelay() {
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.off(Phaser.Input.Events.POINTER_DOWN, this.onClick, this);
    this.woolParticles?.destroy();
    this.currentDelay?.remove(false);
  }

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
