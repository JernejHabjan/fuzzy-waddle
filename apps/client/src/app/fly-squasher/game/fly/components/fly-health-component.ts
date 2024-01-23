import { FlyHealthBarOptions, FlyHealthUiComponent } from "./fly-health-ui-component";
import { EventEmitter } from "@angular/core";
import { IComponent } from "../../../../probable-waffle/game/core/component.service";
import { ActorDeathType } from "../../../../probable-waffle/game/entity/combat/actor-death-type";
import { DamageType } from "../../../../probable-waffle/game/entity/combat/damage-type";
import { Actor } from "../../../../probable-waffle/game/entity/actor/actor";

export type HealthDefinition = {
  maxHealth: number;
  // todo maybe armor type..
};

export class FlyHealthComponent implements IComponent {
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  private currentHealth: number;
  private healthUiComponent!: FlyHealthUiComponent;

  constructor(
    private readonly actor: Actor,
    private readonly scene: Phaser.Scene,
    public readonly healthDefinition: HealthDefinition,
    private readonly barOptions: () => FlyHealthBarOptions,
    regenerateHealth: boolean = false,
    private regenerateHealthRate: number = 0,
    private actorDeathType?: ActorDeathType,
    private actorDeathSound?: string
  ) {
    this.currentHealth = healthDefinition.maxHealth;
  }

  init() {
    this.healthUiComponent = new FlyHealthUiComponent(this.actor, this.scene, this.barOptions);
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
    this.setCurrentHealth(0);
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

  setVisibilityUiComponent(visibility: boolean) {
    this.healthUiComponent.setVisibility(visibility);
  }

  getCurrentHealth() {
    return this.currentHealth;
  }

  isAlive() {
    return this.currentHealth > 0;
  }

  resetHealth() {
    this.setCurrentHealth(this.healthDefinition.maxHealth);
  }

  destroy() {
    this.healthUiComponent.destroy();
  }
}
