import { EventEmitter } from "@angular/core";
import { HealthUiComponent } from "./health-ui-component";
import { Subject, Subscription } from "rxjs";
import { DamageType, type HealthComponentData } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../../building/container-component";
import Phaser from "phaser";
import { getActorComponent } from "../../../../data/actor-component";
import { ConstructionSiteComponent } from "../../construction/construction-site-component";
import {
  getGameObjectBounds,
  getGameObjectDepth,
  getGameObjectVisibility,
  onObjectReady
} from "../../../../data/game-object-helper";
import { SelectableComponent } from "../../selectable-component";
import { OwnerComponent } from "../../owner-component";
import { getCurrentPlayerNumber } from "../../../../data/scene-data";
import { AudioActorComponent } from "../../actor-audio/audio-actor-component";
import { AnimationActorComponent } from "../../animation/animation-actor-component";
import { EffectsAnims } from "../../../../animations/effects";
import { ActorTranslateComponent } from "../../movement/actor-translate-component";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { AudioService } from "../../../../world/services/audio.service";
import {
  SharedActorActionsSfxBodyFallSounds,
  SharedActorActionsSfxBuildingDestroySounds
} from "../../../../sfx/shared-actor-actions-sfx";
import { VisionComponent } from "../../vision-component";
import { AnimationType } from "../../animation/animation-type";
import { SoundType } from "../../actor-audio/sound-type";
import { ActorPhysicalType } from "./actor-physical-type";
import type { SoundDefinition } from "../../actor-audio/sound-definition";
import type { HealthDefinition } from "./health-definition";
import { BuildingDestructionEffect } from "../../building/building-destruction-effect";
import { FadeOutComponent } from "../../building/fade-out-component";
import type { FadeOutDefinition } from "../../building/fade-out-definition";
import { SimulationTickService } from "../../../../world/services/simulation-tick.service";
import { CancelableSimDelay, getSimulationNow } from "../../../../world/services/simulation-time";
import { ProbableWaffleSceneEventName } from "../../../../world/services/recovery/probable-waffle-scene-events";

export class HealthComponent {
  static readonly DEBUG = false;
  static readonly KilledEvent = "killed";
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  armorChanged: EventEmitter<number> = new EventEmitter<number>();

  healthComponentData: HealthComponentData;
  private healthUiComponent!: HealthUiComponent;
  private armorUiComponent?: HealthUiComponent;

  private destroyAfterMs = 30000;

  latestDamage?: {
    damageInitiator: Phaser.GameObjects.GameObject | undefined;
    damage: number;
    damageType: DamageType;
    timestamp: Date;
    sceneTime: number;
    simulationTick?: number;
  };
  private uiComponentsVisible: boolean = true;
  uiComponentsVisibilityChanged: Subject<boolean> = new Subject<boolean>();
  private shouldUiElementsBeVisible: boolean = false;
  private constructionProgressSubscription?: Subscription;
  private healthUiHideOnTimeout?: Phaser.Time.TimerEvent;
  private destroyActorOnDelay?: CancelableSimDelay;
  private animationActorComponent?: AnimationActorComponent;
  private audioActorComponent?: AudioActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private audioService?: AudioService;
  hidden: boolean = false;
  /** Suppresses visual/audio damage reactions when set (e.g. during a silent kill). */
  private suppressReactions = false;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public healthDefinition: HealthDefinition
  ) {
    // Initial health and armor data
    const initialData: HealthComponentData = {
      health: healthDefinition.maxHealth,
      armour: healthDefinition.maxArmour ?? 0
    };

    this.healthComponentData = initialData;

    // Initialize UI components for health and armor
    this.healthUiComponent = new HealthUiComponent(this.gameObject, "health");
    if (this.healthComponentData.armour > 0) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);

    onObjectReady(gameObject, this.init, this);
  }

  private reactToDamage(): void {
    if (this.suppressReactions) return;
    if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Damage);
    if (this.latestDamage?.damageType !== DamageType.Poison) this.reactToDamageVisually();
  }

  private reactToDamageVisually() {
    let asTint: Phaser.GameObjects.Components.Tint & { clearTint?: () => void };
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
        asTint = this.gameObject as any as Phaser.GameObjects.Components.Tint & { clearTint?: () => void };
        if (asTint.setTint) {
          asTint.setTint(0xff0000);
          // Clear the hit-flash tint after a short delay so it doesn't stick
          // Intentional wall-clock timer: tint cleanup is visual-only.
          this.gameObject.scene.time.delayedCall(500, () => {
            if (this.gameObject.active) asTint.clearTint?.();
          });
        }
        // TODO #650: Set rubble in its place - use ConstructionGameObjectInterfaceComponent and rename it somehow
        break;
      case ActorPhysicalType.Organic:
        asTint = this.gameObject as any as Phaser.GameObjects.Components.Tint & { clearTint?: () => void };
        if (asTint.setTint) {
          asTint.setTint(0xff0000);
          // console.warn("this tint is not working "); // todo
          // Intentional wall-clock timer: tint cleanup is visual-only.
          this.gameObject.scene.time.delayedCall(500, () => {
            if (this.gameObject.active) asTint.clearTint?.();
          });
        }
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
        this.refreshVisibilityFrameNonDeterministic()
      );
    }
    // Todo - now calling refreshVisibility on tick to update visibility due to FOW changes
    // Intentional frame update: health/armor bars are UI visibility, not simulation-authoritative state.
    this.gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.refreshVisibilityFrameNonDeterministic, this);

    if (!this.healthDefinition.healthDisplayBehavior || this.healthDefinition.healthDisplayBehavior === "always") {
      this.setVisibilityUiComponent(true);
    } else {
      this.setVisibilityUiComponent(false);
    }
  }

  private refreshVisibilityFrameNonDeterministic() {
    this.setVisibilityUiComponent(this.shouldUiElementsBeVisible);
  }

  canDamageOrKillOnOwnerAction(): boolean {
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
    const simulationTick = getSceneService(this.gameObject.scene, SimulationTickService)?.currentTick;
    this.latestDamage = {
      damage,
      damageType,
      damageInitiator,
      timestamp: new Date(),
      sceneTime: getSimulationNow(this.gameObject.scene),
      simulationTick
    };

    if (this.healthComponentData.armour > 0) {
      this.setArmorValue(Math.max(this.healthComponentData.armour - damage, 0));
    } else {
      this.setHealthValue(Math.max(this.healthComponentData.health - damage, 0));
    }

    this.gameObject.scene.events.emit(ProbableWaffleSceneEventName.ScoreDamage, this.gameObject, damage, damageInitiator);

    if (this.healthDefinition.healthDisplayBehavior === "onDamage") {
      this.setVisibilityUiComponent(true);
      // Hide the UI component after a delay if it's set to "onDamage"
      this.healthUiHideOnTimeout?.remove();
      // Intentional wall-clock timer: health bar visibility timeout is UI-only.
      this.healthUiHideOnTimeout = this.gameObject.scene.time.delayedCall(3000, () => {
        if (this.gameObject.active) this.setVisibilityUiComponent(false);
      });
    }
  }

  heal(amount: number) {
    this.setHealthValue(Math.min(this.healthComponentData.health + amount, this.healthDefinition.maxHealth));
  }

  /** Destroys the actor immediately without playing death animations or sounds. */
  destroyActorSilently() {
    if (!this.gameObject.active || !this.gameObject.scene) return;
    this.suppressReactions = true;
    this.setHealthValue(0, false);
    this.gameObject.scene.events.emit(HealthComponent.KilledEvent, this.gameObject);
    // emit last
    this.gameObject.emit(HealthComponent.KilledEvent);
    this.gameObject.destroy();
  }

  killActor() {
    if (!this.gameObject.active || !this.gameObject.scene) return;
    this.setHealthValue(0, false);
    this.gameObject.scene.events.emit(HealthComponent.KilledEvent, this.gameObject);
    this.playDeathSound();

    // Spawn building destruction effects (rubble and smoke) for structural actors
    if (this.healthDefinition.physicalState === ActorPhysicalType.Structural) {
      const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
      if (constructionSiteComponent) {
        BuildingDestructionEffect.spawnDestructionEffects(this.gameObject);
      }
    } else {
      const fadeOutDurationMs = 5000;
      new FadeOutComponent(this.gameObject, {
        durationBeforeFadeOutMs: this.destroyAfterMs - fadeOutDurationMs,
        fadeOutDurationMs
      } satisfies FadeOutDefinition);
    }

    this.playDeathAnimation();

    this.destroyActorOnDelay?.remove();
    this.destroyActorOnDelay = new CancelableSimDelay(this.gameObject.scene, this.destroyAfterMs, () => {
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
        // can be random as it doesn't need to be deterministic
        randomSoundIndex = Math.floor(Math.random() * SharedActorActionsSfxBodyFallSounds.length);
        randomSound = SharedActorActionsSfxBodyFallSounds[randomSoundIndex]!;
        if (this.audioService)
          this.audioService.playSpatialAudioSprite(this.gameObject, randomSound.key, randomSound.spriteName);
        if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Death);
        break;
      case ActorPhysicalType.Structural:
        // can be random as it doesn't need to be deterministic
        randomSoundIndex = Math.floor(Math.random() * SharedActorActionsSfxBuildingDestroySounds.length);
        randomSound = SharedActorActionsSfxBuildingDestroySounds[randomSoundIndex]!;
        if (this.audioService)
          this.audioService.playSpatialAudioSprite(this.gameObject, randomSound.key, randomSound.spriteName);
        break;
    }
  }

  resetHealth() {
    this.setHealthValue(this.healthDefinition.maxHealth, false);
  }

  resetArmor() {
    this.setArmorValue(this.healthDefinition.maxArmour ?? 0, false);
  }

  setHealthDefinition(healthDefinition: HealthDefinition) {
    this.healthDefinition = healthDefinition;
    this.setHealthValue(healthDefinition.maxHealth, false);
    this.setArmorValue(healthDefinition.maxArmour ?? 0, false);
    this.syncArmorUiComponent();
    this.refreshUiComponents();
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
    this.constructionProgressSubscription?.unsubscribe();
    this.healthUiHideOnTimeout?.remove();
    this.destroyActorOnDelay?.remove();
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.refreshVisibilityFrameNonDeterministic, this);
  }

  get alive(): boolean {
    return this.healthComponentData.health > 0;
  }

  get killed(): boolean {
    return !this.alive;
  }

  getData(): HealthComponentData {
    return { ...this.healthComponentData };
  }

  setData(data: Partial<HealthComponentData>) {
    if (data.health !== undefined) {
      this.setHealthValue(data.health, false);
    }
    if (data.armour !== undefined) {
      this.setArmorValue(data.armour, false);
      this.syncArmorUiComponent();
    }
    this.refreshUiComponents();
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

  private syncArmorUiComponent() {
    const hasArmor = (this.healthDefinition.maxArmour ?? 0) > 0;
    if (hasArmor) {
      this.armorUiComponent ??= new HealthUiComponent(this.gameObject, "armor");
      this.armorUiComponent.setVisibility(this.uiComponentsVisible);
      return;
    }

    this.armorUiComponent?.destroy();
    this.armorUiComponent = undefined;
  }

  private refreshUiComponents() {
    this.healthUiComponent.refresh();
    this.armorUiComponent?.refresh();
  }

  private setHealthValue(value: number, triggerReactions: boolean = true) {
    const previousValue = this.healthComponentData.health;
    if (previousValue === value) return;

    this.healthComponentData.health = value;
    this.healthChanged.emit(value);

    if (!triggerReactions) return;

    if (value < previousValue) {
      this.reactToDamage();
    } else {
      this.reactToHeal();
    }

    if (value <= 0 && !this.suppressReactions) {
      this.killActor();
    }
  }

  private setArmorValue(value: number, triggerReactions: boolean = true) {
    const previousValue = this.healthComponentData.armour;
    if (previousValue === value) return;

    this.healthComponentData.armour = value;
    this.armorChanged.emit(value);

    if (!triggerReactions || this.suppressReactions) return;
    if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Damage);

    if (HealthComponent.DEBUG) console.log(`Armor changed from ${previousValue} to ${value}`);
  }
}
