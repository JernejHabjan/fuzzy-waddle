import { GameEventEmitter as EventEmitter } from "@fuzzy-waddle/platform-game-host";
import { Subject } from "rxjs";
import { HealthPresentation } from "./health-presentation";
import { DamageType, type HealthComponentData } from "@fuzzy-waddle/probable-waffle-protocol";
import Phaser from "phaser";
import { getActorComponent } from "../../../../data/actor-component";
import { ConstructionSiteComponent } from "../../construction/construction-site-component";
import {
  getGameObjectVisibility,
  isGameObjectActiveInActiveScene,
  onObjectReady
} from "../../../../data/game-object-helper";
import { SelectableComponent } from "../../selectable-component";
import { OwnerComponent } from "../../owner-component";
import { getCurrentPlayerNumber, getPlayer } from "../../../../data/scene-data";
import { AudioActorComponent } from "../../actor-audio/audio-actor-component";
import { AnimationActorComponent } from "../../animation/animation-actor-component";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { AudioService } from "../../../../world/services/audio.service";
import {
  SharedActorActionsSfxBodyFallSounds,
  SharedActorActionsSfxBuildingDestroySounds
} from "../../../../sfx/shared-actor-actions-sfx";
import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";
import { SoundType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import type { SoundDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/actor-audio/sound-definition";
import type { HealthDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/health-definition";
import { applyCampaignProgressionModifiers } from "../../../../campaign/campaign-progression-modifier";
import { BuildingDestructionEffect } from "../../building/building-destruction-effect";
import { FadeOutComponent } from "../../building/fade-out-component";
import type { FadeOutDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/building/fade-out-definition";
import { SimulationTickService } from "../../../../world/services/simulation-tick.service";
import { CancelableSimDelay, getSimulationNow } from "../../../../world/services/simulation-time";
import { ProbableWaffleSceneEventName } from "../../../../world/services/recovery/probable-waffle-scene-events";

export class HealthComponent {
  static readonly DEBUG = false;
  static readonly KilledEvent = "killed";
  healthChanged: EventEmitter<number> = new EventEmitter<number>();
  armorChanged: EventEmitter<number> = new EventEmitter<number>();

  /** Authoritative mutable state; presentation reads this reference rather than a snapshot. */
  healthComponentData: HealthComponentData;
  private readonly presentation: HealthPresentation;

  private destroyAfterMs = 30000;

  latestDamage?: {
    damageInitiator: Phaser.GameObjects.GameObject | undefined;
    damage: number;
    damageType: DamageType;
    timestamp: Date;
    sceneTime: number;
    simulationTick?: number;
  };
  uiComponentsVisibilityChanged: Subject<boolean> = new Subject<boolean>();
  private destroyActorOnDelay?: CancelableSimDelay;
  private animationActorComponent?: AnimationActorComponent;
  private audioActorComponent?: AudioActorComponent;
  private audioService?: AudioService;
  hidden: boolean = false;
  /** Documents the following declaration and its compatibility contract. */
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

    this.presentation = new HealthPresentation(
      this.gameObject, () => this.healthDefinition, () => this.healthComponentData,
      (visible) => this.uiComponentsVisibilityChanged.next(visible)
    );

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.presentation.attach();

    onObjectReady(gameObject, this.init, this);
  }

  private reactToDamage(): void {
    if (this.suppressReactions) return;
    if (this.audioActorComponent) this.audioActorComponent.playCustomSound(SoundType.Damage);
    if (this.latestDamage?.damageType !== DamageType.Poison) this.presentation.reactToDamageVisually();
  }

  private init() {
    const maximumHealth = applyCampaignProgressionModifiers(
      this.gameObject,
      "maximum-health",
      this.healthDefinition.maxHealth
    );
    const maximumArmour = applyCampaignProgressionModifiers(
      this.gameObject,
      "armor",
      this.healthDefinition.maxArmour ?? 0
    );
    this.healthDefinition = { ...this.healthDefinition, maxHealth: maximumHealth, maxArmour: maximumArmour };
    this.healthComponentData.health = maximumHealth;
    this.healthComponentData.armour = maximumArmour;
    this.presentation.initializeArmorFromData();
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.presentation.init();
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

  getHealthUiComponentBounds(): Phaser.Geom.Rectangle {
    return this.presentation.getHealthUiComponentBounds();
  }

  takeDamage(damage: number, damageType: DamageType, damageInitiator?: Phaser.GameObjects.GameObject) {
    if (this.gameObject.getData("campaign.invulnerable") === true) return;
    const sourceOwner = damageInitiator ? getActorComponent(damageInitiator, OwnerComponent)?.getOwner() : undefined;
    const campaignDamageScale = getPlayer(this.gameObject.scene, sourceOwner)?.playerController.data.playerDefinition
      ?.campaignDamageScale;
    damage *= campaignDamageScale ?? 1;
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

    this.gameObject.scene.events.emit(
      ProbableWaffleSceneEventName.ScoreDamage,
      this.gameObject,
      damage,
      damageInitiator
    );

    this.presentation.showOnDamage();
  }

  heal(amount: number) {
    this.setHealthValue(Math.min(this.healthComponentData.health + amount, this.healthDefinition.maxHealth));
  }

  /** Documents the destroy actor silently member and its declared contract at this boundary. */
  destroyActorSilently() {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
    this.suppressReactions = true;
    this.setHealthValue(0, false);
    this.gameObject.scene.events.emit(HealthComponent.KilledEvent, this.gameObject);
    // emit last
    this.gameObject.emit(HealthComponent.KilledEvent);
    this.gameObject.destroy();
  }

  killActor() {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
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
    this.presentation.syncArmorUiComponent();
    this.presentation.refreshUiComponents();
  }

  setVisibilityUiComponent(visible: boolean) {
    this.presentation.setVisibilityUiComponent(visible);
  }

  private destroy() {
    this.presentation.disposeTimers();
    this.destroyActorOnDelay?.remove();
    this.presentation.detach();
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
      this.presentation.syncArmorUiComponent();
    }
    this.presentation.refreshUiComponents();
  }

  get isDamaged() {
    return this.healthComponentData.health < this.healthDefinition.maxHealth && this.alive;
  }

  get healthIsFull() {
    return this.healthComponentData.health === this.healthDefinition.maxHealth;
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
      this.presentation.reactToHeal();
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
