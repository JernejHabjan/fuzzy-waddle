import { DamageType } from "../damage-type";
import { EventEmitter } from "@angular/core";
import { HealthUiComponent } from "./health-ui-component";
import { listenToActorEvents, sendActorEvent } from "../../../data/scene-data";
import { Subscription } from "rxjs";
import { HealthComponentData } from "@fuzzy-waddle/api-interfaces";
import Phaser from "phaser";

export type HealthDefinition = {
  maxHealth: number;
  maxArmor?: number;
  regenerateHealthRate?: number;

  // todo maybe armor type..
};

export class HealthComponent {
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  armorChanged: EventEmitter<number> = new EventEmitter<number>();
  private healthComponentData: HealthComponentData = {
    health: 0,
    armor: 0
  };
  private healthUiComponent!: HealthUiComponent;
  private armorUiComponent?: HealthUiComponent;
  private playerChangedSubscription?: Subscription;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healthDefinition: HealthDefinition
  ) {
    this.healthComponentData = {
      health: healthDefinition.maxHealth,
      armor: healthDefinition.maxArmor ?? 0
    } satisfies HealthComponentData;
    this.healthUiComponent = new HealthUiComponent(this.gameObject, "health");
    if (healthDefinition.maxArmor) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }
    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);

    setTimeout(() => {
      // todo for test reduce health of actor
      this.setCurrentHealth(50);
    }, 1000);
  }

  private init() {
    this.listenToHealthEvents();
  }

  takeDamage(damage: number, damageType: DamageType, damageInitiator?: Phaser.GameObjects.GameObject) {
    this.setCurrentHealth(this.healthComponentData.health - damage, damageInitiator);
  }

  killActor() {
    this.setCurrentHealth(0);
    this.healthUiComponent.destroy();
    this.armorUiComponent?.destroy();
    this.gameObject.destroy(); // todo kill?
    // todo something else as well
  }

  setCurrentHealth(newHealth: number, damageInitiator?: Phaser.GameObjects.GameObject) {
    if (this.healthComponentData.health <= 0) return;
    if (newHealth < 0) newHealth = 0;
    const previousHealth = this.healthComponentData.health;
    if (previousHealth === newHealth) return;
    this.healthComponentData.health = newHealth;

    this.broadcastHealthChange();

    if (this.healthComponentData.health <= 0) {
      this.killActor();
    }
  }

  setVisibilityUiComponent(visibility: boolean) {
    this.healthUiComponent.setVisibility(visibility);
    this.armorUiComponent?.setVisibility(visibility);
  }

  getCurrentHealth() {
    return this.healthComponentData.health;
  }

  isAlive() {
    return this.healthComponentData.health > 0;
  }

  resetHealth() {
    this.setCurrentHealth(this.healthDefinition.maxHealth);
  }

  getCurrentArmor() {
    return this.healthComponentData.armor;
  }

  resetArmor() {
    this.setCurrentArmor(this.healthDefinition.maxArmor ?? 0);
  }

  setCurrentArmor(newArmor: number) {
    if (newArmor < 0) newArmor = 0;
    const previousArmor = this.healthComponentData.armor;
    if (previousArmor === newArmor) return;
    this.healthComponentData.armor = newArmor;
    this.broadcastArmorChange();
  }

  private listenToHealthEvents() {
    this.playerChangedSubscription = listenToActorEvents(this.gameObject, "health")?.subscribe((payload) => {
      switch (payload.property) {
        case "health.health":
          this.setCurrentHealth(payload.data.actorDefinition!.health!.health!);
          break;
        case "health.armor":
          this.setCurrentArmor(payload.data.actorDefinition!.health!.armor!);
          break;
      }
    });
  }

  private broadcastHealthChange() {
    const health = this.getCurrentHealth();
    this.healthChanged.emit(health);
    sendActorEvent(this.gameObject, "health.health", { actorDefinition: { health: { health } } });
  }

  private broadcastArmorChange() {
    const armor = this.getCurrentArmor();
    this.armorChanged.emit(armor);
    sendActorEvent(this.gameObject, "health.armor", { actorDefinition: { health: { armor } } });
  }

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
  }
}
