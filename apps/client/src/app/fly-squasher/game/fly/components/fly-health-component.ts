import { FlyHealthBarOptions, FlyHealthUiComponent } from "./fly-health-ui-component";
import { EventEmitter } from "@angular/core";
import { IComponent } from "../../../../probable-waffle/game/core/component.service";
import { Actor } from "../../../../probable-waffle/game/entity/actor/actor";

export type HealthDefinition = {
  maxHealth: number;
};

export class FlyHealthComponent implements IComponent {
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  private currentHealth: number;
  private healthUiComponent!: FlyHealthUiComponent;

  constructor(
    private readonly actor: Actor,
    private readonly scene: Phaser.Scene,
    public readonly healthDefinition: HealthDefinition,
    private readonly barOptions: () => FlyHealthBarOptions
  ) {
    this.currentHealth = healthDefinition.maxHealth;
  }

  init() {
    this.healthUiComponent = new FlyHealthUiComponent(this.actor, this.scene, this.barOptions);
  }

  start() {
    this.healthUiComponent.start();
  }

  update() {
    if (!this.actor.destroyed) {
      this.healthUiComponent.update();
    }
  }

  takeDamage(damage: number) {
    this.setCurrentHealth(this.currentHealth - damage);
  }

  killActor() {
    this.setCurrentHealth(0);
    this.healthUiComponent.destroy();
    this.actor.kill();
    // todo something else as well
  }

  setCurrentHealth(newHealth: number) {
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

  destroy() {
    this.healthUiComponent.destroy();
  }
}
