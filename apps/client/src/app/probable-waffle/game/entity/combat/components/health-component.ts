import { DamageType } from "../damage-type";
import { EventEmitter } from "@angular/core";
import { HealthUiComponent } from "./health-ui-component";
import { onSceneInitialized } from "../../../data/game-object-helper";
import { PositionPlayerDefinition } from "@fuzzy-waddle/api-interfaces";

export type HealthDefinition = {
  maxHealth: number;
  maxArmor?: number;
  regenerateHealthRate?: number;

  // todo maybe armor type..
};

export class HealthComponent {
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  armorChanged: EventEmitter<number> = new EventEmitter<number>();
  private currentHealth: number;
  private currentArmor: number;
  private healthUiComponent!: HealthUiComponent;
  private armorUiComponent?: HealthUiComponent;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healthDefinition: HealthDefinition
  ) {
    this.currentHealth = healthDefinition.maxHealth;
    this.currentArmor = healthDefinition.maxArmor ?? 0;
    this.healthUiComponent = new HealthUiComponent(this.gameObject, "health");
    if (healthDefinition.maxArmor) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }
    onSceneInitialized(this.gameObject.scene, this.sceneInitialized, this);
  }

  private sceneInitialized() {
    // todo start listening to gameState and update health/armor and emit events if this health/armor changes
  }

  takeDamage(damage: number, damageType: DamageType, damageInitiator?: Phaser.GameObjects.GameObject) {
    this.setCurrentHealth(this.currentHealth - damage, damageInitiator);
  }

  killActor() {
    this.setCurrentHealth(0);
    this.healthUiComponent.destroy();
    this.armorUiComponent?.destroy();
    this.gameObject.destroy(); // todo kill?
    // todo something else as well
  }

  setCurrentHealth(newHealth: number, damageInitiator?: Phaser.GameObjects.GameObject) {
    if (this.currentHealth <= 0) return;
    this.currentHealth = newHealth;
    this.healthChanged.emit(this.currentHealth);
    if (this.currentHealth <= 0) {
      this.killActor();
    }
  }

  setVisibilityUiComponent(visibility: boolean) {
    this.healthUiComponent.setVisibility(visibility);
    this.armorUiComponent?.setVisibility(visibility);
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

  getCurrentArmor() {
    return this.currentArmor;
  }

  resetArmor() {
    this.setCurrentArmor(this.healthDefinition.maxArmor ?? 0);
  }

  setCurrentArmor(newArmor: number) {
    this.currentArmor = newArmor;
    this.armorChanged.emit(this.currentArmor);
  }
}
