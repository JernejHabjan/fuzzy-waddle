import { StatusEffectComponent } from "./status-effect-component";
import { Subscription } from "rxjs";
import { StatusEffectData, StatusEffectType } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import Phaser from "phaser";
import { onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";

export class StatusEffectVisualComponent {
  private statusEffectComponent?: StatusEffectComponent;
  private sprite?: Phaser.GameObjects.Sprite;
  private originalTint?: number;
  private wasAnimationPlaying: boolean = false;
  private currentTint?: number;

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
   * Placeholder for future particle effects
   * @param effectName The name of the particle effect to attach
   */
  attachParticleEffect(_effectName: string): void {
    // TODO: Implement particle effects (ice crystals at feet, fire particles, etc.)
    // This is a placeholder for future implementation
  }

  private destroy(): void {
    this.effectAppliedSubscription?.unsubscribe();
    this.effectRemovedSubscription?.unsubscribe();

    // Restore original state on destroy
    this.removeTint();
    this.resumeAnimation();
  }
}
