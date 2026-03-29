import { onObjectReady } from "../../../data/game-object-helper";
import { OrderType } from "../../../ai/order-type";
import { ActorTranslateComponent } from "../movement/actor-translate-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { HealthComponent } from "../combat/components/health-component";
import { AttackComponent } from "../combat/components/attack-component";
import { GathererComponent } from "../resource/gatherer-component";
import { AnimationType } from "./animation-type";
import { AnimationVariant } from "./animation-variant";
import type { IsoDirection } from "../movement/iso-directions";
import { oneTimeAnimations } from "./one-time-animations";
import type { ActorAnimationsDefinition } from "./actor-animations-definition";
import type { AnimationOptions } from "./animation-options";
import { environment } from "../../../../../../environments/environment";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import type { AnimationDefinitionMap } from "./animation-definition-map";

export class AnimationActorComponent {
  private sprite?: Phaser.GameObjects.Sprite;
  private currentAnimation: string | null = null;
  private currentDirection: IsoDirection;
  private isAnimating: boolean = false;
  private directionChangedSubscription?: Subscription;

  constructor(
    public readonly gameObject: Phaser.GameObjects.GameObject,
    public animationsDefinition: ActorAnimationsDefinition | null = null
  ) {
    this.currentDirection = animationsDefinition?.defaultDirection || "south";
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  playOrderAnimation(orderType: OrderType, animationOptions?: AnimationOptions) {
    const animationType = this.mapOrderTypeToAnimationType(orderType);

    // If this is a walk animation and the actor is carrying resources, use the appropriate variant
    if (animationType === AnimationType.Walk && !animationOptions?.variant) {
      const variant = this.getWalkVariantForCarriedResources();
      if (variant) {
        animationOptions = { ...animationOptions, variant };
      }
    }

    this.playAnimation(animationType, animationOptions);
  }

  playCustomAnimation(key: AnimationType | string, animationOptions?: AnimationOptions) {
    this.playAnimation(key, animationOptions);
  }

  swapAnimationSet(newAnimations: AnimationDefinitionMap, defaultDirection?: IsoDirection) {
    this.animationsDefinition = {
      animations: newAnimations,
      defaultDirection: defaultDirection || this.animationsDefinition?.defaultDirection || "south"
    };

    // Restart current animation with new definition if one was playing
    if (this.currentAnimation && this.isAnimating) {
      this.playAnimation(this.currentAnimation, { forceRestart: true });
    }
  }

  private init() {
    this.setSprite();
    this.listenToDirectionChange();
    if (!this.currentAnimation) {
      // play animation, so it plays with correct "level" if the animation gets swapped on startup
      this.playAnimation(AnimationType.Idle);
    }
  }

  private setSprite() {
    if (this.gameObject instanceof Phaser.GameObjects.Sprite) {
      this.sprite = this.gameObject;
    } else if (this.gameObject instanceof Phaser.GameObjects.Container) {
      // Try to find a sprite in the container
      const sprite = this.gameObject.getAll().find((child) => child instanceof Phaser.GameObjects.Sprite);
      if (sprite instanceof Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
        // console.warn("chosen random sprite", sprite); // todo
      }
    }

    if (!this.sprite) {
      console.warn("AnimationActorComponent: No sprite found for animations");
    }
  }

  private listenToDirectionChange() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.directionChangedSubscription = actorTranslateComponent.onDirectionChanged.subscribe((newDirection) => {
      this.setDirection(newDirection);
    });
  }

  private setDirection(direction: IsoDirection) {
    if (this.currentDirection === direction) return;
    this.currentDirection = direction;
    // If there's a current animation playing, update it with the new direction
    if (this.currentAnimation && this.sprite) {
      this.playAnimation(this.currentAnimation, { forceRestart: true });
    }
  }

  private playAnimation(type: AnimationType | string | null, animationOptions?: AnimationOptions) {
    if (!this.sprite || !this.animationsDefinition || !type) return;

    if (!environment.production) {
      const healthComponent = getActorComponent(this.gameObject, HealthComponent);
      if (healthComponent?.killed === true && type !== AnimationType.Death) {
        console.error(`AnimationActorComponent: Tried to play order animation ${type} for dead actor`, this.gameObject);
        return; // Don't play animations for dead actors
      }
    }

    const animationsByType = this.animationsDefinition.animations[type];
    if (!animationsByType) {
      console.warn(`AnimationActorComponent: No animation found for type ${type} in animations definition`);
      return;
    }

    let animationDef = animationsByType[this.currentDirection];
    if (!animationDef) {
      // try to get animation by non-iso directions (in case only orthogonal directions are defined):
      let nonIsoDirection: IsoDirection | null = null;
      if (this.currentDirection === "northeast" || this.currentDirection === "southeast") {
        nonIsoDirection = "east";
      } else if (this.currentDirection === "northwest" || this.currentDirection === "southwest") {
        nonIsoDirection = "west";
      }
      if (nonIsoDirection) {
        animationDef = animationsByType[nonIsoDirection];
      }
    }
    if (!animationDef) {
      // try to get animation by iso directions (in case only iso directions are defined):
      let isoDirection: IsoDirection | null = null;
      switch (this.currentDirection) {
        case "east":
          isoDirection = "northeast";
          break;
        case "west":
          isoDirection = "northwest";
          break;
        case "south":
          isoDirection = "southwest";
          break;
        case "north":
          isoDirection = "northeast";
          break;
      }
      if (isoDirection) {
        animationDef = animationsByType[isoDirection];
      }
    }

    if (!animationDef) {
      console.warn(
        `AnimationActorComponent: No animation found for type ${type} and direction ${this.currentDirection}`
      );
      return;
    }

    if (!animationOptions) {
      animationOptions = {
        forceRestart: false
      } satisfies AnimationOptions;
    }

    // Check if a variant is requested and exists
    let effectiveDef = animationDef;
    const variantDef = animationOptions.variant && animationDef.variants?.[animationOptions.variant];
    if (variantDef) {
      // If variant is a string, create a temporary definition with that key
      if (typeof variantDef === "string") {
        effectiveDef = { key: variantDef };
      } else {
        // If variant is an object, use it as the definition
        effectiveDef = variantDef;
      }
    }

    // Don't restart the animation if it's already playing unless forced
    if (!animationOptions.forceRestart && this.currentAnimation === type && this.sprite.anims.isPlaying) {
      return;
    }

    this.currentAnimation = type;

    const config: Phaser.Types.Animations.PlayAnimationConfig = {
      key: effectiveDef.key
    };

    if (effectiveDef.frameRate !== undefined) {
      config.frameRate = effectiveDef.frameRate;
    }

    if (effectiveDef.repeat !== undefined) {
      config.repeat = effectiveDef.repeat;
    }

    if (animationOptions.repeat !== undefined) {
      // Override the repeat value if provided in animationOptions
      config.repeat = animationOptions.repeat;
    }

    this.isAnimating = true;
    this.sprite.play(config);

    // Handle animation completion
    this.sprite.once("animationcomplete", () => {
      this.isAnimating = false;

      animationOptions?.onComplete?.();

      // If this was a one-time animation like attack, return to idle
      if (oneTimeAnimations.includes(type as AnimationType)) {
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (this.gameObject && this.gameObject.scene && (!healthComponent || !healthComponent.killed)) {
          this.playAnimation(AnimationType.Idle, animationOptions);
        }
      }
    });
  }

  private mapOrderTypeToAnimationType(orderType: OrderType): AnimationType | null {
    switch (orderType) {
      case OrderType.Attack:
        return this.getAttackAnimationType();
      case OrderType.Build:
        return AnimationType.Build;
      case OrderType.Gather:
        return this.getGatherAnimationType();
      case OrderType.Move:
        return AnimationType.Walk;
      case OrderType.ReturnResources:
        return AnimationType.Walk;
      case OrderType.Stop:
        return AnimationType.Idle;
      case OrderType.Repair:
        return AnimationType.Repair;
      case OrderType.Heal:
        return AnimationType.Heal;
      case OrderType.EnterContainer:
        return AnimationType.Walk;
      default:
        return AnimationType.Idle;
    }
  }

  private getAttackAnimationType(): AnimationType | null {
    const attackComponent = getActorComponent(this.gameObject, AttackComponent);
    if (!attackComponent) return null;
    const currentAttack = attackComponent.currentAttack;
    if (currentAttack === null) return null;
    const attackAnimation = currentAttack.animationType;
    return attackAnimation || null;
  }

  private getGatherAnimationType(): AnimationType | null {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return null;
    return gathererComponent.getGatherAnimation();
  }

  private getWalkVariantForCarriedResources(): AnimationVariant | null {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent || !gathererComponent.isCarryingResources()) return null;

    const resourceType = gathererComponent.carriedResourceType;
    if (!resourceType) return null;

    switch (resourceType) {
      case ResourceType.Wood:
        return AnimationVariant.CarryingLogs;
      case ResourceType.Stone:
      case ResourceType.Minerals:
        return AnimationVariant.CarryingOre;
      default:
        return null;
    }
  }

  private destroy() {
    this.directionChangedSubscription?.unsubscribe();
  }
}
