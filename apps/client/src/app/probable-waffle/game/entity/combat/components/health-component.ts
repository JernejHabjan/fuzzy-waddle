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
import { environment } from "../../../../../../environments/environment";
import { SelectableComponent } from "../../actor/components/selectable-component";
import { OwnerComponent } from "../../actor/components/owner-component";
import { getCurrentPlayerNumber } from "../../../data/scene-data";

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
  private killKey?: Phaser.Input.Keyboard.Key | undefined;
  private damageKey?: Phaser.Input.Keyboard.Key | undefined;
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
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) {
      const shouldBeVisible = this.shouldUiElementsBeVisible;
      this.setVisibilityUiComponent(false);
      this.shouldUiElementsBeVisible = shouldBeVisible;
      this.constructionProgressSubscription = constructionSiteComponent.constructionStateChanged.subscribe(() =>
        this.setVisibilityUiComponent(this.shouldUiElementsBeVisible)
      );
    }

    this.bindKillKey();

    if (!environment.production) {
      this.bindDamageKey();
    }
  }

  private bindKillKey() {
    this.killKey = this.gameObject.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE);
    if (!this.killKey) return;
    this.killKey.on(Phaser.Input.Keyboard.Events.DOWN, this.killSelected, this);
  }

  private killSelected() {
    if (!this.canDamageOrKillOnKeyboardAction()) return;
    this.killActor();
  }

  private bindDamageKey() {
    this.damageKey = this.gameObject.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    if (!this.damageKey) return;
    this.damageKey.on(Phaser.Input.Keyboard.Events.DOWN, this.damageSelected, this);
  }

  private damageSelected() {
    if (!this.canDamageOrKillOnKeyboardAction()) return;
    this.takeDamage(1, DamageType.Physical);
  }

  private canDamageOrKillOnKeyboardAction(): boolean {
    const selectionComponent = getActorComponent(this.gameObject, SelectableComponent);
    if (!selectionComponent) return false;
    if (!selectionComponent.getSelected()) return false;
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (!ownerComponent) return false;
    const currentPlayerNumber = getCurrentPlayerNumber(this.gameObject.scene);
    if (currentPlayerNumber === undefined) return false;
    if (ownerComponent.getOwner() !== currentPlayerNumber) return false;
    // noinspection RedundantIfStatementJS
    if (!this.alive) return false;
    return true;
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

  heal(amount: number) {
    this.healthComponentData.health = Math.min(
      this.healthComponentData.health + amount,
      this.healthDefinition.maxHealth
    );
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
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) visibility = false;
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
    this.killKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.killSelected, this);
    this.damageKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.damageSelected, this);
  }

  get alive(): boolean {
    return this.healthComponentData.health > 0;
  }

  get killed(): boolean {
    return !this.alive;
  }

  getData(): HealthComponentData {
    return this.healthComponentData;
  }

  setData(data: Partial<HealthComponentData>) {
    this.healthComponentData = { ...this.healthComponentData, ...data };
  }

  get isDamaged() {
    return this.healthComponentData.health < this.healthDefinition.maxHealth && this.alive;
  }

  get healthIsFull() {
    return this.healthComponentData.health === this.healthDefinition.maxHealth;
  }
}
