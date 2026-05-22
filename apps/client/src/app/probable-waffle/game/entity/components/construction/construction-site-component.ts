import { PaymentType } from "../production/payment-type";
import {
  type ConstructionSiteComponentData,
  ConstructionStateEnum,
  ObjectNames,
  ResourceType
} from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../owner-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getGameObjectVisibility, onObjectReady } from "../../../data/game-object-helper";
import { getResearchedLevelForActor } from "../../../data/actor-level-utils";
import { BehaviorSubject, Subject } from "rxjs";
import { upgradeFromConstructingToFullActorData } from "../../../data/actor-data";
import { ConstructionProgressUiComponent } from "./construction-progress-ui-component";
import { BuilderComponent } from "./builder-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import {
  SharedActorActionsSfxHammeringSounds,
  SharedActorActionsSfxSawingSounds,
  SharedActorActionsSfxSelectionSounds
} from "../../../sfx/shared-actor-actions-sfx";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { ConstructionSiteDefinition } from "./construction-site-definition";
import type { ProductionCostDefinition } from "../production/production-cost-definition";
import { IdComponent } from "../id-component";
import GameObject = Phaser.GameObjects.GameObject;
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSimulationDelta } from "../../../world/services/simulation-time";
import { ProbableWaffleSceneEventName } from "../../../world/services/recovery/probable-waffle-scene-events";

export class ConstructionSiteComponent {
  public progressPercentage = 0;
  public constructionProgressPercentageChanged: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.progressPercentage
  );
  private remainingConstructionTime = 0;
  private state: ConstructionStateEnum = ConstructionStateEnum.NotStarted;
  public constructionStateChanged: Subject<ConstructionStateEnum> = new Subject<ConstructionStateEnum>();
  private assignedBuilders: GameObject[] = [];
  private assignedRepairers: GameObject[] = [];
  constructionProgressUiComponent: ConstructionProgressUiComponent;
  private audioService?: AudioService;
  private healthComponent?: HealthComponent;
  private lastSimulationTimeMs?: number;
  private playingBuildSound: boolean = false;
  private pendingAssignedBuilderIds?: string[];
  private pendingAssignedRepairerIds?: string[];
  constructor(
    private readonly gameObject: GameObject,
    private readonly constructionSiteDefinition: ConstructionSiteDefinition
  ) {
    this.constructionProgressUiComponent = new ConstructionProgressUiComponent(this.gameObject);
    onObjectReady(gameObject, this.init, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
  }

  private init() {
    if (this.state === ConstructionStateEnum.NotStarted) {
      this.setInitialHealth();
    }
    if (this.state === ConstructionStateEnum.Finished) {
      this.progressPercentage = 100;
      this.constructionProgressPercentageChanged.next(this.progressPercentage);
    }
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent);
  }

  private get productionDefinition(): ProductionCostDefinition | null {
    const definition = getPwActorDefinition(this.gameObject.name, getResearchedLevelForActor(this.gameObject));
    return definition?.components?.productionCost ?? null;
  }

  update(): void {
    this.tryResolveAssignedActorReferences();

    const simulationDelta = getSimulationDelta(this.gameObject.scene, this.lastSimulationTimeMs);
    this.lastSimulationTimeMs = simulationDelta.now;
    const deltaWithTimeScale = simulationDelta.delta;

    if (this.state == ConstructionStateEnum.Finished) {
      this.tryRepair(deltaWithTimeScale);
      return;
    }

    this.tryBuild(deltaWithTimeScale);
  }

  private tryBuild(deltaWithTimeScale: number) {
    if (this.state === ConstructionStateEnum.NotStarted && this.constructionSiteDefinition.startImmediately) {
      this.startConstruction();
      this.setInitialHealth();
    }

    if (this.state === ConstructionStateEnum.NotStarted && this.assignedBuilders.length > 0) {
      this.startConstruction();
    }

    if (this.state !== ConstructionStateEnum.Constructing) return;

    if (this.healthComponent?.killed) return;

    const speedBoost = 1.0;
    const constructionProgress =
      deltaWithTimeScale * this.constructionSiteDefinition.progressMadeAutomatically * speedBoost +
      deltaWithTimeScale *
        this.constructionSiteDefinition.progressMadePerBuilder *
        this.assignedBuilders.length *
        speedBoost;

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    this.remainingConstructionTime -= constructionProgress;
    const healthComponent = this.healthComponent;
    if (healthComponent) {
      const maxHealth = healthComponent.healthDefinition.maxHealth;
      const initialHealth = maxHealth * this.constructionSiteDefinition.initialHealthPercentage;
      const totalHealthToGain = maxHealth - initialHealth;

      // Calculate health increment based on total health to gain
      const healthIncrement = (totalHealthToGain / productionDefinition.productionTime) * constructionProgress;
      healthComponent.healthComponentData.health += healthIncrement;
      healthComponent.healthComponentData.health = Math.min(healthComponent.healthComponentData.health, maxHealth);

      // Handle armor similarly
      const maxArmour = healthComponent.healthDefinition.maxArmour;
      if (maxArmour) {
        const initialArmour = maxArmour * this.constructionSiteDefinition.initialHealthPercentage;
        const totalArmourToGain = maxArmour - initialArmour;
        const armourIncrement = (totalArmourToGain / productionDefinition.productionTime) * constructionProgress;
        healthComponent.healthComponentData.armour += armourIncrement;
        healthComponent.healthComponentData.armour = Math.min(healthComponent.healthComponentData.armour, maxArmour);
      }
    }

    this.playBuildSound();

    // Check if finished.
    if (this.remainingConstructionTime <= 0) {
      this.finishConstruction();
    }

    this.progressPercentage = this.getProgressFraction() * 100;
    this.constructionProgressPercentageChanged.next(this.progressPercentage);
  }

  private playBuildSound() {
    if (!this.audioService) return;
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (!visibilityComponent || !visibilityComponent.visible) return;
    if (this.playingBuildSound) return;
    this.playingBuildSound = true;
    const soundDefinitions = [...SharedActorActionsSfxHammeringSounds, ...SharedActorActionsSfxSawingSounds];
    // can be random as it doesn't need to be deterministic
    const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
    this.audioService.playSpatialAudioSprite(
      this.gameObject,
      soundDefinition.key,
      soundDefinition.spriteName,
      undefined,
      {
        onComplete: () => {
          this.playingBuildSound = false;
        }
      }
    );
  }

  startConstruction() {
    if (this.state !== ConstructionStateEnum.NotStarted) {
      throw new Error("ConstructionSiteComponent can only be started once");
    }
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    if (productionDefinition.productionTime === PaymentType.PayImmediately) {
      const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
      const owner = ownerComponent?.getOwner();
      if (!owner) throw new Error("Owner not found");
      const player = getPlayer(this.gameObject.scene, owner);
      if (!player) throw new Error("PlayerController not found");

      const canAfford = player.canPayAllResources(productionDefinition.resources);
      if (canAfford) {
        emitResource(this.gameObject.scene, "resource.removed", productionDefinition.resources, owner);
      } else {
        throw new Error("Cannot afford building costs");
      }
    }

    // start building
    this.remainingConstructionTime = productionDefinition.productionTime;
    this.state = ConstructionStateEnum.Constructing;
    this.constructionStateChanged.next(this.state);
  }

  private setInitialHealth() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent) {
      healthComponent.healthComponentData.health = Math.floor(
        healthComponent.healthDefinition.maxHealth * this.constructionSiteDefinition.initialHealthPercentage
      );
      if (healthComponent.healthDefinition.maxArmour) {
        healthComponent.healthComponentData.armour = Math.floor(
          healthComponent.healthDefinition.maxArmour * this.constructionSiteDefinition.initialHealthPercentage
        );
      }
    }
  }

  cancelConstruction() {
    if (this.isFinished) return;

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    const TimeRefundFactor =
      productionDefinition.costType === PaymentType.PayImmediately ? this.getProgressFraction() : 1.0;
    const actualRefundFactor = this.constructionSiteDefinition.refundFactor * TimeRefundFactor;

    // refund costs
    const refundCosts: Partial<Record<ResourceType, number>> = {};
    Object.entries(productionDefinition.resources).forEach(([key, value]) => {
      refundCosts[key as ResourceType] = Math.floor(value * actualRefundFactor);
    });

    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = ownerComponent?.getOwner();
    emitResource(this.gameObject.scene, "resource.added", refundCosts, owner);

    // stop action on builders
    this.assignedBuilders.forEach((builder) => {
      const payerPawnAiController = getActorComponent(builder, PawnAiController);
      payerPawnAiController?.blackboard.resetCurrentOrder();
    });
  }

  get isFinished() {
    return this.state === ConstructionStateEnum.Finished;
  }

  canAssignBuilder() {
    return (
      this.assignedBuilders.length < this.constructionSiteDefinition.maxAssignedBuilders &&
      !this.isFinished &&
      (this.healthComponent === undefined || !this.healthComponent.killed)
    );
  }

  assignBuilder(gameObject: GameObject) {
    this.assignedBuilders.push(gameObject);
  }

  unAssignBuilder(gameObject: GameObject) {
    const index = this.assignedBuilders.indexOf(gameObject);
    if (index >= 0) {
      this.assignedBuilders.splice(index, 1);
    }
  }

  canAssignRepairer() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return false;
    return (
      this.assignedRepairers.length < this.constructionSiteDefinition.maxAssignedRepairers &&
      healthComponent.healthComponentData.health < healthComponent.healthDefinition.maxHealth
    );
  }
  assignRepairer(gameObject: GameObject) {
    this.assignedRepairers.push(gameObject);
  }
  unAssignRepairer(gameObject: GameObject) {
    const index = this.assignedRepairers.indexOf(gameObject);
    if (index >= 0) {
      this.assignedRepairers.splice(index, 1);
    }
  }

  private tryRepair(deltaWithTimeScale: number) {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return;

    if (this.assignedRepairers.length === 0) return;
    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) return;

    const repairAmount =
      deltaWithTimeScale * this.constructionSiteDefinition.repairFactor * this.assignedRepairers.length;
    healthComponent.healthComponentData.health += repairAmount;
    healthComponent.healthComponentData.health = Math.min(
      healthComponent.healthComponentData.health,
      healthComponent.healthDefinition.maxHealth
    );

    this.playBuildSound();

    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) {
      this.assignedRepairers.forEach((repairer) => {
        const builderComponent = getActorComponent(repairer, BuilderComponent);
        if (builderComponent) {
          builderComponent.leaveRepairSite();
        }
      });
    }
  }

  private finishConstruction() {
    this.state = ConstructionStateEnum.Finished;
    this.constructionStateChanged.next(this.state);

    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (visibilityComponent && visibilityComponent.visible) {
      const soundDefinitions = SharedActorActionsSfxSelectionSounds;
      // can be random as it doesn't need to be deterministic
      const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
      this.audioService?.playSpatialAudioSprite(this.gameObject, soundDefinition.key, soundDefinition.spriteName);
    }

    if (this.constructionSiteDefinition.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        builder.destroy();
      });
    }

    upgradeFromConstructingToFullActorData(this.gameObject);
    this.gameObject.scene.events.emit(ProbableWaffleSceneEventName.ScoreBuildingConstructed, this.gameObject);
  }

  private getProgressFraction() {
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    const val = 1 - this.remainingConstructionTime / productionDefinition.productionTime;
    return Math.min(1, Math.max(0, val)); // clamp between 0 and 1
  }

  getData(): ConstructionSiteComponentData {
    return {
      state: this.state,
      remainingConstructionTime: this.remainingConstructionTime,
      progressPercentage: this.progressPercentage,
      assignedBuilders: this.assignedBuilders.map((builder) => getActorComponent(builder, IdComponent)!.id),
      assignedRepairers: this.assignedRepairers.map((repairer) => getActorComponent(repairer, IdComponent)!.id),
      playingBuildSound: this.playingBuildSound
    } satisfies ConstructionSiteComponentData;
  }

  setData(data: Partial<ConstructionSiteComponentData>) {
    if (data.state !== undefined) this.state = data.state;
    if (data.remainingConstructionTime !== undefined) this.remainingConstructionTime = data.remainingConstructionTime;
    if (data.progressPercentage !== undefined) this.progressPercentage = data.progressPercentage;
    if (data.playingBuildSound !== undefined) this.playingBuildSound = data.playingBuildSound;
    // assigned builders and repairers are set after all objects are loaded.
    this.pendingAssignedBuilderIds = data.assignedBuilders ? [...data.assignedBuilders] : undefined;
    this.pendingAssignedRepairerIds = data.assignedRepairers ? [...data.assignedRepairers] : undefined;
    this.tryResolveAssignedActorReferences();

    this.constructionProgressPercentageChanged.next(this.progressPercentage);
    this.constructionStateChanged.next(this.state);
  }

  private onDestroy() {
    this.cancelConstruction();
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  private tryResolveAssignedActorReferences(): void {
    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (!actorIndex) {
      return;
    }

    if (this.pendingAssignedBuilderIds) {
      this.assignedBuilders = this.pendingAssignedBuilderIds
        .map((id) => actorIndex.getActorById(id))
        .filter((obj): obj is GameObject => obj !== null);
      if (this.assignedBuilders.length === this.pendingAssignedBuilderIds.length) {
        this.pendingAssignedBuilderIds = undefined;
      }
    }

    if (this.pendingAssignedRepairerIds) {
      this.assignedRepairers = this.pendingAssignedRepairerIds
        .map((id) => actorIndex.getActorById(id))
        .filter((obj): obj is GameObject => obj !== null);
      if (this.assignedRepairers.length === this.pendingAssignedRepairerIds.length) {
        this.pendingAssignedRepairerIds = undefined;
      }
    }
  }
}
