import { onObjectReady } from "../../../data/game-object-helper";
import { ActorTranslateComponent } from "../movement/actor-translate-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { HealthComponent } from "../combat/components/health-component";
import { AnimationType } from "./animation-type";
import type { IsoDirection } from "../movement/iso-directions";
import type { ActorAnimationsDefinition } from "./actor-animations-definition";
import { RepresentableComponent } from "../representable-component";

/**
 * Lightweight animation component for ship units (Phaser.GameObjects.Image).
 * Switches the displayed frame based on movement direction and adds a gentle wobble tween.
 */
export class ShipAnimationComponent {
  private currentDirection: IsoDirection = "south";
  private directionChangedSubscription?: Subscription;
  private wobbleTween?: Phaser.Tweens.Tween;
  /** Separate wobble offset object so the tween never touches image.y directly. */
  private readonly wobbleData = { offset: 0 };
  private representableComponent?: RepresentableComponent;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly animationsDefinition: ActorAnimationsDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onKilled, this);
  }

  private init() {
    this.representableComponent = getActorComponent(this.gameObject, RepresentableComponent);
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
    // Tween a separate offset value (never modifies image.y directly).
    // onUpdate reads the current rendered Y from RepresentableComponent so the
    // wobble is always relative to wherever the movement system placed the ship
    // that frame — eliminating the first-frame position snap.
    this.wobbleTween = this.gameObject.scene.tweens.add({
      targets: this.wobbleData,
      offset: 3,
      duration: 1200,
      ease: "Sine.InOut",
      yoyo: true,
      loop: -1,
      onUpdate: () => {
        if (!this.representableComponent) return;
        image.y = this.representableComponent.renderedWorldTransform.y - this.wobbleData.offset;
      }
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
