import { DamageType } from "../damage-type";
import { EventEmitter } from "@angular/core";
import { HealthUiComponent } from "./health-ui-component";
import { Subscription } from "rxjs";
import { HealthComponentData } from "@fuzzy-waddle/api-interfaces";
import { ComponentSyncSystem, SyncOptions } from "../../systems/component-sync.system";

export type HealthDefinition = {
  maxHealth: number;
  maxArmor?: number;
  regenerateHealthRate?: number;
};

export class HealthComponent {
  static readonly KilledEvent = "killed";
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  armorChanged: EventEmitter<number> = new EventEmitter<number>();

  healthComponentData: HealthComponentData;
  private healthUiComponent!: HealthUiComponent;
  private armorUiComponent?: HealthUiComponent;
  private playerChangedSubscription?: Subscription;

  latestDamage?: {
    damageInitiator: Phaser.GameObjects.GameObject | undefined;
    damage: number;
    damageType: DamageType;
    timestamp: Date;
  };
  private syncConfig = {
    eventPrefix: "health",
    propertyMap: {
      health: "health",
      armor: "armor"
    },
    eventEmitters: {
      health: this.healthChanged,
      armor: this.armorChanged
    },
    hooks: {
      health: (value: number, previousValue: number) => {
        if (value <= 0) {
          this.killActor(); // Custom logic when health reaches zero
        }
      },
      armor: (value: number, previousValue: number) => {
        // Example of custom logic when armor changes
        console.log(`Armor changed from ${previousValue} to ${value}`);
      }
    }
  } satisfies SyncOptions<HealthComponentData>;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healthDefinition: HealthDefinition
  ) {
    // Initial health and armor data
    const initialData: HealthComponentData = {
      health: healthDefinition.maxHealth,
      armor: healthDefinition.maxArmor ?? 0
    };

    // Sync health and armor with external events, using hooks for custom logic
    this.healthComponentData = new ComponentSyncSystem().syncComponent<HealthComponentData>(
      gameObject,
      initialData,
      this.syncConfig
    );

    // Initialize UI components for health and armor
    this.healthUiComponent = new HealthUiComponent(this.gameObject, "health");
    if (this.healthComponentData.armor > 0) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy.bind(this));
  }

  getHealthUiComponentBounds(): Phaser.Geom.Rectangle {
    const healthComponentBounds = this.healthUiComponent.getBounds();
    const armorComponentBounds = this.armorUiComponent?.getBounds();

    return new Phaser.Geom.Rectangle(
      healthComponentBounds.x,
      healthComponentBounds.y,
      healthComponentBounds.width,
      armorComponentBounds
        ? healthComponentBounds.height + armorComponentBounds.height - HealthUiComponent.barBorder
        : healthComponentBounds.height
    );
  }

  takeDamage(damage: number, damageType: DamageType, damageInitiator?: Phaser.GameObjects.GameObject) {
    if (this.healthComponentData.armor > 0) {
      this.healthComponentData.armor = Math.max(this.healthComponentData.armor - damage, 0);
    } else {
      this.healthComponentData.health = Math.max(this.healthComponentData.health - damage, 0);
    }
    this.latestDamage = {
      damage,
      damageType,
      damageInitiator,
      timestamp: new Date()
    };
  }

  killActor() {
    this.healthComponentData.health = 0;
    this.gameObject.emit(HealthComponent.KilledEvent);
    // do not destroy the gameObject just yet
    // this.gameObject.destroy();
  }

  resetHealth() {
    this.healthComponentData.health = this.healthDefinition.maxHealth;
  }

  resetArmor() {
    this.healthComponentData.armor = this.healthDefinition.maxArmor ?? 0;
  }

  setVisibilityUiComponent(visibility: boolean) {
    this.healthUiComponent.setVisibility(visibility);
    this.armorUiComponent?.setVisibility(visibility);
  }

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
  }
}
