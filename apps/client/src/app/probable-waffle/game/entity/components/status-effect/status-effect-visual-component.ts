import { StatusEffectComponent } from "./status-effect-component";
import { Subscription } from "rxjs";
import { type StatusEffectData, StatusEffectType } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import Phaser from "phaser";
import { getGameObjectRenderedTransform, onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { EffectsAnims } from "../../../animations/effects";

export class StatusEffectVisualComponent {
  private statusEffectComponent?: StatusEffectComponent;
  private sprite?: Phaser.GameObjects.Sprite; // todo this is not the best way to handle this.
  private originalTint?: number;
  private wasAnimationPlaying: boolean = false;
  private currentTint?: number;
  private particleEffects: Map<StatusEffectType, Phaser.GameObjects.Sprite> = new Map();

  private effectAppliedSubscription?: Subscription;
  private effectRemovedSubscription?: Subscription;

  private readonly effectTintColors: Record<StatusEffectType, number> = {
    [StatusEffectType.Stunned]: 0x888888,
    [StatusEffectType.Frozen]: 0x6666ff,
    [StatusEffectType.Slowed]: 0x99ccff,
    [StatusEffectType.Burning]: 0xff6600,
    [StatusEffectType.Poisoned]: 0x00ff00,
    [StatusEffectType.Regenerating]: 0x00ff88
  };

  private readonly effectAnimations: Record<StatusEffectType, string> = {
    [StatusEffectType.Stunned]: EffectsAnims.ANIM_IMPACT_23, // todo
    [StatusEffectType.Frozen]: EffectsAnims.ANIM_IMPACT_23, // todo
    [StatusEffectType.Slowed]: EffectsAnims.ANIM_IMPACT_23, // todo
    [StatusEffectType.Burning]: EffectsAnims.ANIM_IMPACT_5, // todo
    [StatusEffectType.Poisoned]: EffectsAnims.ANIM_IMPACT_10, // todo
    [StatusEffectType.Regenerating]: EffectsAnims.ANIM_IMPACT_23 // todo
  };

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init(): void {
    this.statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);

    if (!this.statusEffectComponent) return;

    this.setSprite();

    this.effectAppliedSubscription = this.statusEffectComponent.effectApplied.subscribe((effect) =>
      this.onEffectApplied(effect)
    );
    this.effectRemovedSubscription = this.statusEffectComponent.effectRemoved.subscribe((type) =>
      this.onEffectRemoved(type)
    );
  }

  private setSprite(): void {
    if (this.gameObject instanceof Phaser.GameObjects.Sprite) {
      this.sprite = this.gameObject;
    } else if (this.gameObject instanceof Phaser.GameObjects.Container) {
      const sprite = this.gameObject.getAll().find((child) => child instanceof Phaser.GameObjects.Sprite);
      if (sprite instanceof Phaser.GameObjects.Sprite) {
        this.sprite = sprite;
      }
    }
  }

  private onEffectApplied(effect: StatusEffectData): void {
    // Apply tint
    const tintColor = effect.tintColor ?? this.effectTintColors[effect.type];
    if (tintColor !== undefined) {
      this.applyTint(tintColor);
    }

    // Handle stun effects - pause animation
    if (effect.type === StatusEffectType.Stunned || effect.type === StatusEffectType.Frozen) {
      this.pauseAnimation();
    }

    // Attach particle effect at actor's feet
    this.attachParticleEffect(effect.type);
  }

  private onEffectRemoved(type: StatusEffectType): void {
    // Check if we still have any effects that affect visuals
    const activeEffects = this.statusEffectComponent?.getActiveEffects() ?? [];

    // Restore animation if no stun/freeze effects remain
    if (type === StatusEffectType.Stunned || type === StatusEffectType.Frozen) {
      const stillStunned = activeEffects.some(
        (e) => e.type === StatusEffectType.Stunned || e.type === StatusEffectType.Frozen
      );
      if (!stillStunned) {
        this.resumeAnimation();
      }
    }

    // Update tint based on remaining effects
    this.updateTintFromActiveEffects(activeEffects);

    // Remove particle effect for this type
    this.removeParticleEffect(type);
  }

  private applyTint(color: number): void {
    if (!this.sprite) return;

    // Store original tint only once
    if (this.originalTint === undefined) {
      this.originalTint = this.sprite.tint;
    }

    this.currentTint = color;
    this.sprite.setTint(color);
  }

  private removeTint(): void {
    if (!this.sprite) return;

    this.currentTint = undefined;

    if (this.originalTint !== undefined) {
      if (this.originalTint === 0xffffff) {
        this.sprite.clearTint();
      } else {
        this.sprite.setTint(this.originalTint);
      }
    } else {
      this.sprite.clearTint();
    }
  }

  private updateTintFromActiveEffects(activeEffects: StatusEffectData[]): void {
    if (activeEffects.length === 0) {
      this.removeTint();
      return;
    }

    // Priority order: Frozen > Stunned > Burning > Poisoned > Slowed > Regenerating
    const priorityOrder: StatusEffectType[] = [
      StatusEffectType.Frozen,
      StatusEffectType.Stunned,
      StatusEffectType.Burning,
      StatusEffectType.Poisoned,
      StatusEffectType.Slowed,
      StatusEffectType.Regenerating
    ];

    for (const type of priorityOrder) {
      const effect = activeEffects.find((e) => e.type === type);
      if (effect) {
        const tintColor = effect.tintColor ?? this.effectTintColors[type];
        if (tintColor !== undefined) {
          this.applyTint(tintColor);
          return;
        }
      }
    }

    // No tint-affecting effects remain
    this.removeTint();
  }

  private pauseAnimation(): void {
    if (!this.sprite) return;

    this.wasAnimationPlaying = this.sprite.anims?.isPlaying ?? false;
    if (this.wasAnimationPlaying) {
      this.sprite.anims.pause();
    }
  }

  private resumeAnimation(): void {
    if (!this.sprite) return;

    if (this.wasAnimationPlaying) {
      this.sprite.anims.resume();
    }
    this.wasAnimationPlaying = false;
  }

  /**
   * Attach a particle effect sprite at the actor's feet
   * @param effectType The type of status effect to display
   */
  attachParticleEffect(effectType: StatusEffectType): void {
    // Check if we already have an effect of this type
    if (this.particleEffects.has(effectType)) {
      return;
    }

    // Get the animation for this effect type
    const animName = this.effectAnimations[effectType];
    if (!animName) return;

    // Get actor position
    const actorTransform = getGameObjectRenderedTransform(this.gameObject);
    if (!actorTransform) return;

    // Create effect sprite at actor's feet (slightly below center)
    const effectSprite = EffectsAnims.createAndPlayEffectAnimation(
      this.gameObject.scene,
      animName,
      actorTransform.x,
      actorTransform.y + 10 // Offset down to feet // todo
    );

    // Make it loop instead of destroy on complete
    effectSprite.off("animationcomplete");
    effectSprite.on("animationcomplete", () => {
      if (effectSprite.active) {
        effectSprite.play(animName);
      }
    });

    // Apply tint color
    const tintColor = this.effectTintColors[effectType];
    if (tintColor !== undefined) {
      effectSprite.setTint(tintColor);
    }

    // Set blend mode and alpha for visual effect
    effectSprite.setBlendMode(Phaser.BlendModes.ADD);
    effectSprite.setAlpha(0.6);
    effectSprite.setDepth(1);
    effectSprite.setScale(0.5); // Smaller size at feet

    // Update position as actor moves
    const updatePosition = () => {
      if (!effectSprite.active) return;
      const transform = getGameObjectRenderedTransform(this.gameObject);
      if (transform) {
        effectSprite.setPosition(transform.x, transform.y + 10);
      }
    };

    // Update position on scene update
    this.gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, updatePosition);
    effectSprite.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, updatePosition);
    });

    // Store reference
    this.particleEffects.set(effectType, effectSprite);
  }

  /**
   * Remove particle effect for a specific effect type
   * @param effectType The type of status effect to remove
   */
  removeParticleEffect(effectType: StatusEffectType): void {
    const effectSprite = this.particleEffects.get(effectType);
    if (effectSprite) {
      effectSprite.destroy();
      this.particleEffects.delete(effectType);
    }
  }

  private destroy(): void {
    this.effectAppliedSubscription?.unsubscribe();
    this.effectRemovedSubscription?.unsubscribe();

    // Restore original state on destroy
    this.removeTint();
    this.resumeAnimation();

    // Clean up all particle effects
    for (const [, effectSprite] of this.particleEffects) {
      effectSprite.destroy();
    }
    this.particleEffects.clear();
  }
}
