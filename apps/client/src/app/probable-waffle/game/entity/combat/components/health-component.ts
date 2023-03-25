import { IComponent } from '../../../core/component.service';
import { Actor } from '../../actor/actor';
import { DamageType } from '../damage-type';
import { EventEmitter } from '@angular/core';
import { ActorDeathType } from '../actor-death-type';
import { HealthUiComponent } from './health-ui-component';

export interface Health {
  healthComponent: HealthComponent;
}

export type HealthDefinition = {
  maxHealth: number;
  // todo maybe armor type..
};

export default class HealthComponent implements IComponent {
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  private currentHealth: number;
  private healthUiComponent!: HealthUiComponent;

  constructor(
    private readonly actor: Actor,
    public healthDefinition: HealthDefinition,
    regenerateHealth: boolean = false,
    private regenerateHealthRate: number = 0,
    private actorDeathType?: ActorDeathType,
    private actorDeathSound?: string
  ) {
    this.currentHealth = healthDefinition.maxHealth;
  }

  init() {
    this.healthUiComponent = new HealthUiComponent(this.actor);
  }

  start() {
    this.healthUiComponent.start();
  }

  update(time: number, delta: number) {
    if (!this.actor.destroyed) {
      this.healthUiComponent.update(time, delta);
    }
  }

  takeDamage(damage: number, damageType: DamageType, damageInitiator?: Actor) {
    this.setCurrentHealth(this.currentHealth - damage, damageInitiator);
  }

  killActor() {
    this.healthUiComponent.destroy();
    this.actor.kill();
    // todo something else as well
  }

  setCurrentHealth(newHealth: number, damageInitiator?: Actor) {
    if (this.currentHealth <= 0) {
      return;
    }
    this.currentHealth = newHealth;
    this.healthChanged.emit(this.currentHealth);
    if (this.currentHealth <= 0) {
      this.killActor();
    }
  }

  getCurrentHealth() {
    return this.currentHealth;
  }
}
