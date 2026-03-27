import { onObjectReady } from "../../../data/game-object-helper";
import { ActorTranslateComponent } from "../movement/actor-translate-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { HealthComponent } from "../combat/components/health-component";
import { AnimationType } from "./animation-type";
import type { IsoDirection } from "../movement/iso-directions";
import type { ActorAnimationsDefinition } from "./actor-animations-definition";

/**
 * Lightweight animation component for ship units (Phaser.GameObjects.Image).
 * Switches the displayed frame based on movement direction and adds a gentle wobble tween.
 */
export class ShipAnimationComponent {
  private currentDirection: IsoDirection = "south";
  private directionChangedSubscription?: Subscription;
  private wobbleTween?: Phaser.Tweens.Tween;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly animationsDefinition: ActorAnimationsDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onKilled, this);
  }

  private init() {
    this.listenToDirectionChange();
    this.updateFrame(this.currentDirection);
    this.startWobble();
  }

  private listenToDirectionChange() {
    const translateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!translateComponent) return;
    this.directionChangedSubscription = translateComponent.onDirectionChanged.subscribe((direction) => {
      if (this.currentDirection === direction) return;
      this.currentDirection = direction;
      this.updateFrame(direction);
    });
  }

  private updateFrame(direction: IsoDirection) {
    const image = this.gameObject as Phaser.GameObjects.Image;
    if (!image.setFrame) return;

    const animsByType = this.animationsDefinition.animations[AnimationType.Idle];
    if (!animsByType) return;

    let animDef = animsByType[direction];

    // Fallback: diagonal → orthogonal
    if (!animDef) {
      if (direction === "northeast" || direction === "southeast") {
        animDef = animsByType["east"];
      } else if (direction === "northwest" || direction === "southwest") {
        animDef = animsByType["west"];
      }
    }

    if (!animDef) return;
    image.setFrame(animDef.key);
  }

  private startWobble() {
    const image = this.gameObject as Phaser.GameObjects.Image;
    this.wobbleTween = this.gameObject.scene.tweens.add({
      targets: image,
      y: "-=3",
      duration: 1200,
      ease: "Sine.InOut",
      yoyo: true,
      loop: -1
    });
  }

  private onKilled() {
    this.wobbleTween?.stop();
    this.wobbleTween?.remove();
    this.wobbleTween = undefined;
  }

  private destroy() {
    this.directionChangedSubscription?.unsubscribe();
    this.wobbleTween?.stop();
    this.wobbleTween?.remove();
    this.wobbleTween = undefined;
  }
}
