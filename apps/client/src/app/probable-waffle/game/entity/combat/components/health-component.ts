import { DamageType } from "../damage-type";
import { EventEmitter } from "@angular/core";
import { HealthUiComponent } from "./health-ui-component";
import { Subject, Subscription } from "rxjs";
import { type HealthComponentData } from "@fuzzy-waddle/api-interfaces";
import { ComponentSyncSystem, type SyncOptions } from "../../systems/component-sync.system";
import { ContainerComponent } from "../../building/container-component";
import Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import {
  getGameObjectBounds,
  getGameObjectDepth,
  getGameObjectVisibility,
  onObjectReady
} from "../../../data/game-object-helper";
import { environment } from "../../../../../../environments/environment";
import { SelectableComponent } from "../../actor/components/selectable-component";
import { OwnerComponent } from "../../actor/components/owner-component";
import { getCurrentPlayerNumber } from "../../../data/scene-data";
import { AudioActorComponent, type SoundDefinition, SoundType } from "../../actor/components/audio-actor-component";
import { AnimationActorComponent, AnimationType } from "../../actor/components/animation-actor-component";
import { EffectsAnims } from "../../../animations/effects";
import { ActorTranslateComponent } from "../../actor/components/actor-translate-component";
import { getSceneService } from "../../../world/components/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import {
  SharedActorActionsSfxBodyFallSounds,
  SharedActorActionsSfxBuildingDestroySounds
} from "../../../sfx/SharedActorActionsSfx";
import { VisionComponent } from "../../actor/components/vision-component";

export type HealthDefinition = {
  maxHealth: number;
  maxArmour?: number;
  regenerateHealthRate?: number;
  healthDisplayBehavior?: "always" | "onDamage";
  physicalState: ActorPhysicalType;
};

export enum ActorPhysicalType {
  Biological = "biological",
  Structural = "structural",
  Organic = "organic"
}

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
        if (value < previousValue) {
          this.reactToDamage();
        } else {
          this.reactToHeal();
        }

        if (value <= 0) {
          this.killActor(); // Custom logic when health reaches zero
        }
      },
      armour: (value: number, previousValue: number) => {
        if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Damage);

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
  private attackKey?: Phaser.Input.Keyboard.Key | undefined;
  private animationActorComponent?: AnimationActorComponent;
  private audioActorComponent?: AudioActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private audioService?: AudioService;
  hidden: boolean = false;

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

  private reactToDamage(): void {
    if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Damage);
    if (this.latestDamage?.damageType !== DamageType.Poison) this.reactToDamageVisually();
  }

  private reactToDamageVisually() {
    let asTint;
    switch (this.healthDefinition.physicalState) {
      case ActorPhysicalType.Biological:
        if (this.actorTranslateComponent) {
          const renderedTransform = this.actorTranslateComponent.renderedTransform;
          const effect = EffectsAnims.createAndPlayBloodAnimation(
            this.gameObject.scene,
            renderedTransform.x,
            renderedTransform.y
          );
          const gameObjectDepth = getGameObjectDepth(this.gameObject);
          if (gameObjectDepth) {
            effect.setDepth(gameObjectDepth + 1);
          }
        }
        break;
      case ActorPhysicalType.Structural:
        asTint = this.gameObject as any as Phaser.GameObjects.Components.Tint;
        if (asTint.setTint) asTint.setTint(0xff0000);
        // console.warn("this tint is not working "); // todo

        // TODO SET RUBBLE IN ITS PLACE - use ConstructionGameObjectInterfaceComponent and rename it somehow
        break;
      case ActorPhysicalType.Organic:
        asTint = this.gameObject as any as Phaser.GameObjects.Components.Tint;
        if (asTint.setTint) asTint.setTint(0xff0000);
        // console.warn("this tint is not working "); // todo
        break;
    }
  }

  private init() {
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) {
      const shouldBeVisible = this.shouldUiElementsBeVisible;
      this.setVisibilityUiComponent(false);
      this.shouldUiElementsBeVisible = shouldBeVisible;
      this.constructionProgressSubscription = constructionSiteComponent.constructionStateChanged.subscribe(() =>
        this.refreshVisibility()
      );
    }
    // Todo - now calling refreshVisibility on tick to update visibility due to FOW changes
    this.gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.refreshVisibility, this);

    this.bindKillKey();

    if (!environment.production) {
      this.bindDamageKey();
      this.bindAttackAnimKey();
    }
  }

  private refreshVisibility() {
    this.setVisibilityUiComponent(this.shouldUiElementsBeVisible);
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
    this.takeDamage(10, DamageType.Physical);
  }

  private bindAttackAnimKey() {
    this.attackKey = this.gameObject.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    if (!this.attackKey) return;
    this.attackKey.on(Phaser.Input.Keyboard.Events.DOWN, this.playAttack, this);
  }

  /**
   * Plays a large slash animation if the actor can damage or kill on keyboard action.
   * This is for testing of jumping UI health up and down
   */
  private playAttack() {
    if (!this.canDamageOrKillOnKeyboardAction()) return;
    const animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    if (!animationActorComponent) return;
    animationActorComponent.playCustomAnimation(AnimationType.LargeSlash);
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
    if (visible) {
      if (!this.healthDefinition.healthDisplayBehavior || this.healthDefinition.healthDisplayBehavior === "always") {
        this.setVisibilityUiComponent(true);
      } else {
        this.setVisibilityUiComponent(visible);
      }
    } else {
      this.setVisibilityUiComponent(false);
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
    this.latestDamage = {
      damage,
      damageType,
      damageInitiator,
      timestamp: new Date()
    };

    if (this.healthComponentData.armour > 0) {
      this.healthComponentData.armour = Math.max(this.healthComponentData.armour - damage, 0);
    } else {
      this.healthComponentData.health = Math.max(this.healthComponentData.health - damage, 0);
    }

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
    if (!this.gameObject.active || !this.gameObject.scene) return;
    this.healthComponentData.health = 0;
    this.gameObject.scene.events.emit(HealthComponent.KilledEvent, this.gameObject);
    this.playDeathSound();
    this.playDeathAnimation();
    this.gameObject.scene.time.delayedCall(this.destroyAfterMs, () => {
      this.gameObject.destroy();
    });
    // emit last
    this.gameObject.emit(HealthComponent.KilledEvent);
  }

  private playDeathAnimation() {
    if (this.animationActorComponent) {
      this.animationActorComponent.playCustomAnimation(AnimationType.Death);
    } else {
      // this is just fallback - ensure that you handle this case correctly
      const visibleComponent = this.gameObject as unknown as Phaser.GameObjects.Components.Visible;
      if (visibleComponent.setVisible === undefined) return;
      visibleComponent.setVisible(false);
      this.hidden = true;
    }
  }

  private playDeathSound() {
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (!visibilityComponent || !visibilityComponent.visible) return;
    let randomSound: SoundDefinition;
    let randomSoundIndex: number;
    switch (this.healthDefinition.physicalState) {
      case ActorPhysicalType.Organic:
      case ActorPhysicalType.Biological:
        randomSoundIndex = Math.floor(Math.random() * SharedActorActionsSfxBodyFallSounds.length);
        randomSound = SharedActorActionsSfxBodyFallSounds[randomSoundIndex]!;
        if (this.audioService)
          this.audioService.playSpatialAudioSprite(this.gameObject, randomSound.key, randomSound.spriteName);
        if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Death);
        break;
      case ActorPhysicalType.Structural:
        randomSoundIndex = Math.floor(Math.random() * SharedActorActionsSfxBuildingDestroySounds.length);
        randomSound = SharedActorActionsSfxBuildingDestroySounds[randomSoundIndex]!;
        if (this.audioService)
          this.audioService.playSpatialAudioSprite(this.gameObject, randomSound.key, randomSound.spriteName);
        break;
    }
  }

  resetHealth() {
    this.healthComponentData.health = this.healthDefinition.maxHealth;
  }

  resetArmor() {
    this.healthComponentData.armour = this.healthDefinition.maxArmour ?? 0;
  }

  setVisibilityUiComponent(visible: boolean) {
    if (!this.gameObject.active) return;
    this.shouldUiElementsBeVisible = visible;
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) visible = false;
    const previousVisibility = this.uiComponentsVisible;
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent || !visionComponent.visibilityByCurrentPlayer) visible = false;
    if (visible === previousVisibility) return;
    this.healthUiComponent.setVisibility(visible);
    this.armorUiComponent?.setVisibility(visible);
    this.uiComponentsVisible = visible;
    this.uiComponentsVisibilityChanged.next(visible);
  }

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
    this.constructionProgressSubscription?.unsubscribe();
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    this.killKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.killSelected, this);
    this.damageKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.damageSelected, this);
    this.attackKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.playAttack, this);
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.refreshVisibility, this);
  }

  get alive(): boolean {
    return this.healthComponentData.health > 0;
  }

  get killed(): boolean {
    return !this.alive;
  }

  getData(): HealthComponentData {
    return { ...this.healthComponentData }; // need to clone it so it's not a proxy object
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

  private reactToHeal() {
    if (!this.actorTranslateComponent) return;
    const renderedTransform = this.actorTranslateComponent.renderedTransform;
    const bounds = getGameObjectBounds(this.gameObject)!;
    const effect = EffectsAnims.createAndPlayEffectAnimation(
      this.gameObject.scene,
      EffectsAnims.ANIM_IMPACT_16,
      renderedTransform.x,
      bounds.top
    );
    effect.setScale(0.5);
    effect.setTint(0x00ff00);
    const gameObjectDepth = getGameObjectDepth(this.gameObject);
    if (gameObjectDepth) {
      effect.setDepth(gameObjectDepth + 1);
    }
  }
}
