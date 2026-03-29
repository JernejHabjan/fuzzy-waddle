// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { onObjectReady } from "../../../data/game-object-helper";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../../data/actor-component";
import { AudioActorComponent } from "../../../entity/components/actor-audio/audio-actor-component";
import { AnimationActorComponent } from "../../../entity/components/animation/animation-actor-component";
import { SoundType } from "../../../entity/components/actor-audio/sound-type";
import { RandomService } from "../../../world/services/random.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { RandomMovementComponent } from "../../../entity/components/movement/random-movement.component";
import type { RandomMovementDefinition } from "../../../entity/components/movement/random-movement-definition";
/* END-USER-IMPORTS */

export default class Hedgehog extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 16, y ?? 21.596080279718947, texture || "animals", frame ?? "hedgehog/10.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 18, 11.323425464509395), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.6748775087412171);

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.init, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Hedgehog;
  private actorAudioComponent?: AudioActorComponent;
  private animationActorComponent?: AnimationActorComponent;
  private randomMovementComponent!: RandomMovementComponent;
  private curledUp = false;

  private init() {
    this.actorAudioComponent = getActorComponent(this, AudioActorComponent);
    this.animationActorComponent = getActorComponent(this, AnimationActorComponent);
    this.randomMovementComponent = new RandomMovementComponent(this, {
      radius: 2,
      shouldPreventMovementStart: () => this.curledUp,
      delay: {
        min: 2000,
        max: 6000
      }
    } satisfies RandomMovementDefinition);
    this.handleClick();
  }

  private handleClick() {
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onClick, this);
  }

  private onClick() {
    this.curlUp();
  }

  private curlUp() {
    if (!this.active) return;
    if (this.curledUp) return;
    this.randomMovementComponent.removeDelay();
    this.randomMovementComponent.cancelMovement();

    this.curledUp = true;

    this.animationActorComponent?.playCustomAnimation("ball", {
      onComplete: () => {
        this.curledUp = false;
        this.randomMovementComponent.moveAfterDelay();
      }
    });
    const randomService = getSceneService(this.scene, RandomService)!;
    const sound = randomService.random() < 0.8 ? SoundType.Select : SoundType.SelectExtra;
    this.actorAudioComponent?.playSpatialCustomSound(sound);
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.off(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, this.onClick, this);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
