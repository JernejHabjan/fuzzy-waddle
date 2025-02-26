import { DamageType } from "../damage-type";
import { EventEmitter } from "@angular/core";
import { HealthUiComponent } from "./health-ui-component";
import { Subject, Subscription } from "rxjs";
import { HealthComponentData } from "@fuzzy-waddle/api-interfaces";
import { ComponentSyncSystem, SyncOptions } from "../../systems/component-sync.system";
import { ContainerComponent } from "../../building/container-component";
import Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { onObjectReady } from "../../../data/game-object-helper";

export type HealthDefinition = {
  maxHealth: number;
  maxArmour?: number;
  regenerateHealthRate?: number;
  healthDisplayBehavior?: "always" | "onDamage";
};

export class HealthComponent {
  static readonly DEBUG = false;
  static readonly KilledEvent = "killed";
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  armorChanged: EventEmitter<number> = new EventEmitter<number>();

  healthComponentData: HealthComponentData;
  private healthUiComponent!: HealthUiComponent;
  private armorUiComponent?: HealthUiComponent;
  private playerChangedSubscription?: Subscription;

  private destroyAfterMs = 30000;

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
      armour: "armor"
    },
    eventEmitters: {
      health: this.healthChanged,
      armour: this.armorChanged
    },
    hooks: {
      health: (value: number, previousValue: number) => {
        if (value <= 0) {
          this.killActor(); // Custom logic when health reaches zero
        }
      },
      armour: (value: number, previousValue: number) => {
        // Example of custom logic when armor changes
        if (HealthComponent.DEBUG) console.log(`Armor changed from ${previousValue} to ${value}`);
      }
    }
  } satisfies SyncOptions<HealthComponentData>;
  private uiComponentsVisible: boolean = true;
  uiComponentsVisibilityChanged: Subject<boolean> = new Subject<boolean>();
  private shouldUiElementsBeVisible: boolean = false;
  private constructionProgressSubscription?: Subscription;
  private healthUiHideOnTimeout?: number;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healthDefinition: HealthDefinition
  ) {
    // Initial health and armor data
    const initialData: HealthComponentData = {
      health: healthDefinition.maxHealth,
      armour: healthDefinition.maxArmour ?? 0
    };

    // Sync health and armor with external events, using hooks for custom logic
    this.healthComponentData = new ComponentSyncSystem().syncComponent<HealthComponentData>(
      gameObject,
      initialData,
      this.syncConfig
    );

    // Initialize UI components for health and armor
    this.healthUiComponent = new HealthUiComponent(this.gameObject, "health");
    if (this.healthComponentData.armour > 0) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);

    if (!this.healthDefinition.healthDisplayBehavior || this.healthDefinition.healthDisplayBehavior === "always") {
      this.setVisibilityUiComponent(true);
    } else {
      this.setVisibilityUiComponent(false);
    }

    onObjectReady(gameObject, this.init, this);
  }

  private init() {
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished()) {
      const shouldBeVisible = this.shouldUiElementsBeVisible;
      this.setVisibilityUiComponent(false);
      this.shouldUiElementsBeVisible = shouldBeVisible;
      this.constructionProgressSubscription = constructionSiteComponent.constructionStateChanged.subscribe(() =>
        this.setVisibilityUiComponent(this.shouldUiElementsBeVisible)
      );
    }
  }

  private gameObjectVisibilityChanged(visible: boolean) {
    if (!this.healthDefinition.healthDisplayBehavior || this.healthDefinition.healthDisplayBehavior === "always") {
      this.setVisibilityUiComponent(true);
    } else {
      this.setVisibilityUiComponent(visible);
    }
  }

  getHealthUiComponentBounds(): Phaser.Geom.Rectangle {
    const healthComponentBounds = this.healthUiComponent.getBounds();
    const armorComponentBounds = this.armorUiComponent?.getBounds();

    return new Phaser.Geom.Rectangle(
      healthComponentBounds.x,
      healthComponentBounds.y,
      this.uiComponentsVisible ? healthComponentBounds.width : 0,
      this.uiComponentsVisible
        ? armorComponentBounds
          ? healthComponentBounds.height + armorComponentBounds.height - HealthUiComponent.barBorder
          : healthComponentBounds.height
        : 0
    );
  }

  takeDamage(damage: number, damageType: DamageType, damageInitiator?: Phaser.GameObjects.GameObject) {
    if (this.healthComponentData.armour > 0) {
      this.healthComponentData.armour = Math.max(this.healthComponentData.armour - damage, 0);
    } else {
      this.healthComponentData.health = Math.max(this.healthComponentData.health - damage, 0);
    }
    this.latestDamage = {
      damage,
      damageType,
      damageInitiator,
      timestamp: new Date()
    };

    if (this.healthDefinition.healthDisplayBehavior === "onDamage") {
      this.setVisibilityUiComponent(true);
      // Hide the UI component after a delay if it's set to "onDamage"
      clearTimeout(this.healthUiHideOnTimeout);
      this.healthUiHideOnTimeout = window.setTimeout(() => {
        if (this.gameObject.active) this.setVisibilityUiComponent(false);
      }, 3000);
    }
  }

  killActor() {
    this.healthComponentData.health = 0;
    this.gameObject.emit(HealthComponent.KilledEvent);
    this.playDeathAnimation();
    this.gameObject.scene.time.delayedCall(this.destroyAfterMs, () => {
      this.gameObject.destroy();
    });
  }

  private playDeathAnimation() {
    const sprite = this.gameObject as Phaser.GameObjects.Sprite; // todo
    if (sprite.anims) {
      sprite.play("general_warrior_hurt"); // todo
    } else {
      // todo this is just fallback - ensure that you handle this case correctly
      const visibleComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Visible;
      if (visibleComponent.setVisible === undefined) return;
      visibleComponent.setVisible(false);
    }
  }

  resetHealth() {
    this.healthComponentData.health = this.healthDefinition.maxHealth;
  }

  resetArmor() {
    this.healthComponentData.armour = this.healthDefinition.maxArmour ?? 0;
  }

  setVisibilityUiComponent(visibility: boolean) {
    if (!this.gameObject.active) return;
    this.shouldUiElementsBeVisible = visibility;
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished()) visibility = false;
    const previousVisibility = this.uiComponentsVisible;
    if (visibility === previousVisibility) return;
    this.healthUiComponent.setVisibility(visibility);
    this.armorUiComponent?.setVisibility(visibility);
    this.uiComponentsVisible = visibility;
    this.uiComponentsVisibilityChanged.next(visibility);
  }

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
    this.constructionProgressSubscription?.unsubscribe();
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
  }

  getData(): HealthComponentData {
    return this.healthComponentData;
  }

  setData(data: Partial<HealthComponentData>) {
    this.healthComponentData = { ...this.healthComponentData, ...data };
  }
}
