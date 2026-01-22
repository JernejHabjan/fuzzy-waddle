import { EventEmitter } from '@angular/core';
import { StatusEffectData, StatusEffectType, type StatusEffectComponentData } from '@fuzzy-waddle/api-interfaces';
import { getActorComponent } from '../../../../data/actor-component';
import { HealthComponent } from '../combat/components/health-component';
import { DamageType } from '../combat/damage-type';
import Phaser from 'phaser';
import { onObjectReady } from '../../../../data/game-object-helper';

export class StatusEffectComponent {
  static readonly EffectAppliedEvent = 'effectApplied';
  static readonly EffectRemovedEvent = 'effectRemoved';
  static readonly EffectTickEvent = 'effectTick';

  effectApplied: EventEmitter<StatusEffectData> = new EventEmitter<StatusEffectData>();
  effectRemoved: EventEmitter<StatusEffectType> = new EventEmitter<StatusEffectType>();
  effectTick: EventEmitter<StatusEffectData> = new EventEmitter<StatusEffectData>();

  private activeEffects: StatusEffectData[] = [];
  private healthComponent?: HealthComponent;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);

    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent);
  }

  private destroy(): void {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  applyEffect(effect: StatusEffectData): void {
    const existingEffect = this.activeEffects.find((e) => e.type === effect.type);

    if (existingEffect) {
      // Refresh the effect - reset remaining time to full duration
      existingEffect.remainingTime = effect.duration;
      existingEffect.lastTickTime = this.gameObject.scene.time.now;
      // Update other properties if the new effect is different
      Object.assign(existingEffect, { ...effect, remainingTime: effect.duration });
    } else {
      // Add new effect
      const newEffect: StatusEffectData = {
        ...effect,
        remainingTime: effect.duration,
        lastTickTime: this.gameObject.scene.time.now
      };
      this.activeEffects.push(newEffect);
    }

    // Apply instant damage/heal
    if (effect.instantDamage && this.healthComponent) {
      const damageType = this.stringToDamageType(effect.damageType);
      this.healthComponent.takeDamage(effect.instantDamage, damageType);
    }
    if (effect.instantHeal && this.healthComponent) {
      this.healthComponent.heal(effect.instantHeal);
    }

    this.effectApplied.emit(effect);
    this.gameObject.emit(StatusEffectComponent.EffectAppliedEvent, effect);
  }

  removeEffect(type: StatusEffectType): void {
    const index = this.activeEffects.findIndex((e) => e.type === type);
    if (index !== -1) {
      this.activeEffects.splice(index, 1);
      this.effectRemoved.emit(type);
      this.gameObject.emit(StatusEffectComponent.EffectRemovedEvent, type);
    }
  }

  hasEffect(type: StatusEffectType): boolean {
    return this.activeEffects.some((e) => e.type === type);
  }

  getEffect(type: StatusEffectType): StatusEffectData | undefined {
    return this.activeEffects.find((e) => e.type === type);
  }

  getActiveEffects(): StatusEffectData[] {
    return [...this.activeEffects];
  }

  isStunned(): boolean {
    return this.hasEffect(StatusEffectType.Stunned) || this.hasEffect(StatusEffectType.Frozen);
  }

  isSlowed(): boolean {
    return this.hasEffect(StatusEffectType.Slowed);
  }

  getMovementSpeedModifier(): number {
    let modifier = 1.0;

    for (const effect of this.activeEffects) {
      if (effect.movementSpeedModifier !== undefined) {
        // Multiply modifiers together for stacking slow effects
        modifier *= effect.movementSpeedModifier;
      }
    }

    // Clamp to minimum of 0.1 (90% slow cap)
    return Math.max(0.1, modifier);
  }

  private update(_time: number, delta: number): void {
    if (!this.gameObject.active) return;

    const now = this.gameObject.scene.time.now;
    const effectsToRemove: StatusEffectType[] = [];

    for (const effect of this.activeEffects) {
      // Decrement remaining time
      effect.remainingTime -= delta;

      // Check for tick-based effects (DoT/HoT)
      if (effect.tickInterval && effect.lastTickTime !== undefined) {
        const timeSinceLastTick = now - effect.lastTickTime;

        if (timeSinceLastTick >= effect.tickInterval) {
          // Apply tick effect
          this.applyTickEffect(effect);
          effect.lastTickTime = now;
          this.effectTick.emit(effect);
          this.gameObject.emit(StatusEffectComponent.EffectTickEvent, effect);
        }
      }

      // Check if effect expired
      if (effect.remainingTime <= 0) {
        effectsToRemove.push(effect.type);
      }
    }

    // Remove expired effects
    for (const type of effectsToRemove) {
      this.removeEffect(type);
    }
  }

  private applyTickEffect(effect: StatusEffectData): void {
    if (!this.healthComponent) return;

    // Apply damage per tick
    if (effect.damagePerTick) {
      const damageType = this.stringToDamageType(effect.damageType);
      this.healthComponent.takeDamage(effect.damagePerTick, damageType);
    }

    // Apply heal per tick
    if (effect.healPerTick) {
      this.healthComponent.heal(effect.healPerTick);
    }
  }

  private stringToDamageType(damageTypeStr?: string): DamageType {
    if (!damageTypeStr) return DamageType.Physical;

    switch (damageTypeStr.toLowerCase()) {
      case 'frost':
        return DamageType.Frost;
      case 'fire':
        return DamageType.Fire;
      case 'poison':
        return DamageType.Poison;
      default:
        return DamageType.Physical;
    }
  }

  getData(): StatusEffectComponentData {
    return {
      activeEffects: this.activeEffects.map((e) => ({ ...e }))
    };
  }

  setData(data: Partial<StatusEffectComponentData>): void {
    if (data.activeEffects) {
      this.activeEffects = data.activeEffects.map((e) => ({
        ...e,
        lastTickTime: this.gameObject.scene?.time.now ?? 0
      }));
    }
  }
}
