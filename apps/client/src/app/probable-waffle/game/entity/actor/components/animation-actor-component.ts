import { onObjectReady } from "../../../data/game-object-helper";
import { OrderType } from "../../character/ai/order-type";
import { ActorTranslateComponent, IsoDirection } from "./actor-translate-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { HealthComponent } from "../../combat/components/health-component";
import { AttackComponent } from "../../combat/components/attack-component";
import { GathererComponent } from "./gatherer-component";

export enum AnimationType {
  Idle = "idle",
  Walk = "walk",
  Shoot = "shoot",
  Build = "build",
  Chop = "chop",
  Mine = "mine",
  Repair = "repair",
  Heal = "heal",
  Cast = "cast",
  Death = "death",
  Slash = "slash",
  InvertedSlash = "invertedSlash",
  Smash = "smash",
  Thrust = "thrust",
  LargeSlash = "largeSlash",
  LargeThrust = "largeThrust"
}

const oneTimeAnimations: AnimationType[] = [
  AnimationType.Shoot,
  AnimationType.Cast,
  AnimationType.Slash,
  AnimationType.InvertedSlash,
  AnimationType.Smash,
  AnimationType.Thrust,
  AnimationType.LargeSlash,
  AnimationType.LargeThrust,
  AnimationType.Chop,
  AnimationType.Mine
];

type AnimationDefinition = {
  key: string;
  frameRate?: number;
  repeat?: number;
};

export type AnimationDefinitionMap = {
  [key in AnimationType | string]?: {
    [direction in IsoDirection]?: AnimationDefinition;
  };
};

export interface ActorAnimationsDefinition {
  animations: AnimationDefinitionMap;
  defaultDirection?: IsoDirection;
}

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

  playOrderAnimation(orderType: OrderType, forceRestart: boolean = false) {
    this.playAnimation(this.mapOrderTypeToAnimationType(orderType), forceRestart);
  }

  playCustomAnimation(key: AnimationType | string, forceRestart: boolean = false) {
    this.playAnimation(key, forceRestart);
  }

  private init() {
    this.setSprite();
    this.listenToDirectionChange();
  }

  private setSprite() {
    if (this.gameObject instanceof Phaser.GameObjects.Sprite) {
      this.sprite = this.gameObject;
    } else if (this.gameObject instanceof Phaser.GameObjects.Container) {
      // Try to find a sprite in the container
      const sprite = this.gameObject.getAll().find((child) => child instanceof Phaser.GameObjects.Sprite);
      if (sprite instanceof Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
        console.warn("chosen random sprite", sprite); // todo
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
    this.currentDirection = direction;
    // If there's a current animation playing, update it with the new direction
    if (this.currentAnimation && this.sprite) {
      this.playAnimation(this.currentAnimation, true);
    }
  }

  private playAnimation(type: AnimationType | string | null, forceRestart: boolean = false) {
    if (!this.sprite || !this.animationsDefinition || !type) return;

    const animationsByType = this.animationsDefinition.animations[type];
    if (!animationsByType) {
      console.warn(`AnimationActorComponent: No animation found for type ${type} in animations definition`);
      return;
    }

    let animationDef = animationsByType[this.currentDirection];
    if (!animationDef) {
      // try to obtain animation by non-iso directions:
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
      console.warn(
        `AnimationActorComponent: No animation found for type ${type} and direction ${this.currentDirection}`
      );
      return;
    }

    // Don't restart the animation if it's already playing unless forced
    if (!forceRestart && this.currentAnimation === type && this.sprite.anims.isPlaying) {
      return;
    }

    this.currentAnimation = type;

    const config: Phaser.Types.Animations.PlayAnimationConfig = {
      key: animationDef.key
    };

    if (animationDef.frameRate !== undefined) {
      config.frameRate = animationDef.frameRate;
    }

    if (animationDef.repeat !== undefined) {
      config.repeat = animationDef.repeat;
    }

    this.isAnimating = true;
    this.sprite.play(config);

    // Handle animation completion
    this.sprite.once("animationcomplete", () => {
      this.isAnimating = false;

      // If this was a one-time animation like attack, return to idle
      if (oneTimeAnimations.includes(type as AnimationType)) {
        this.playAnimation(AnimationType.Idle);
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
    const currentAttack = attackComponent.currentAttack; // todo in the future this should be current attack against enemy
    if (currentAttack === null) return null;
    const attackAnimation = attackComponent.getAttackAnimation(currentAttack);
    return attackAnimation || null;
  }

  private getGatherAnimationType(): AnimationType | null {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) return null;
    return gathererComponent.getGatherAnimation();
  }

  private destroy() {
    this.directionChangedSubscription?.unsubscribe();
  }
}
