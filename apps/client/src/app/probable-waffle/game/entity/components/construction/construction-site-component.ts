import { PaymentType } from "../../building/payment-type";
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
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import type { ProductionCostDefinition } from "../production/production-cost-component";
import { getGameObjectVisibility, onObjectReady } from "../../../data/game-object-helper";
import { BehaviorSubject, Subject } from "rxjs";
import { upgradeFromConstructingToFullActorData } from "../../../data/actor-data";
import { ConstructionProgressUiComponent } from "./construction-progress-ui-component";
import { BuilderComponent } from "../builder-component";
import { getSceneService } from "../../../world/components/scene-component-helpers";
import { AudioService } from "../../../world/services/audio.service";
import {
  SharedActorActionsSfxHammeringSounds,
  SharedActorActionsSfxSawingSounds,
  SharedActorActionsSfxSelectionSounds
} from "../../../sfx/SharedActorActionsSfx";
import { PawnAiController } from "../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import GameObject = Phaser.GameObjects.GameObject;

export type ConstructionSiteDefinition = {
  // Whether the building site consumes builders when building is finished
  consumesBuilders: boolean;
  maxAssignedBuilders: number;
  maxAssignedRepairers: number;
  // Factor to multiply all passed building time with, independent of any currently assigned builders
  progressMadeAutomatically: number;
  // Factor to multiply all passed building time with, dependent on the number of builders assigned
  progressMadePerBuilder: number;
  repairFactor: number;
  initialHealthPercentage: number;
  refundFactor: number;
  // Whether to start building immediately after spawn, or not
  startImmediately: boolean;
  finishedSound?: {
    key: string;
  };
  // Whether multiple buildings can be placed one after another by dragging the mouse - Wall building for example
  canBeDragPlaced: boolean;
};

export class ConstructionSiteComponent {
  public progressPercentage = 0;
  public constructionProgressPercentageChanged: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.progressPercentage
  );
  private remainingConstructionTime = 0;
  private constructionSiteData: ConstructionSiteComponentData = {
    state: ConstructionStateEnum.NotStarted
  } satisfies ConstructionSiteComponentData;
  public constructionStateChanged: Subject<ConstructionStateEnum> = new Subject<ConstructionStateEnum>();
  private assignedBuilders: GameObject[] = [];
  private assignedRepairers: GameObject[] = [];
  constructionProgressUiComponent: ConstructionProgressUiComponent = new ConstructionProgressUiComponent(
    this.gameObject
  );
  private audioService?: AudioService;
  private healthComponent?: HealthComponent;
  private playingBuildSound: boolean = false;
  constructor(
    private readonly gameObject: GameObject,
    private readonly constructionSiteDefinition: ConstructionSiteDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
  }

  private init() {
    if (this.constructionSiteData.state === ConstructionStateEnum.NotStarted) {
      this.setInitialHealth();
    }
    if (this.constructionSiteData.state === ConstructionStateEnum.Finished) {
      this.progressPercentage = 100;
      this.constructionProgressPercentageChanged.next(this.progressPercentage);
    }
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent);
  }

  private get productionDefinition(): ProductionCostDefinition | null {
    const definition = pwActorDefinitions[this.gameObject.name as ObjectNames];
    return definition.components?.productionCost ?? null;
  }

  update(time: number, delta: number): void {
    if (this.constructionSiteData.state == ConstructionStateEnum.Finished) {
      this.tryRepair(delta);
      return;
    }

    this.tryBuild(delta);
  }

  private tryBuild(delta: number) {
    if (
      this.constructionSiteData.state === ConstructionStateEnum.NotStarted &&
      this.constructionSiteDefinition.startImmediately
    ) {
      this.startConstruction();
      this.setInitialHealth();
    }

    if (this.constructionSiteData.state === ConstructionStateEnum.NotStarted && this.assignedBuilders.length > 0) {
      this.startConstruction();
    }

    if (this.constructionSiteData.state !== ConstructionStateEnum.Constructing) return;

    if (this.healthComponent?.killed) return;

    const speedBoost = 1.0;
    const constructionProgress =
      delta * this.constructionSiteDefinition.progressMadeAutomatically * speedBoost +
      delta * this.constructionSiteDefinition.progressMadePerBuilder * this.assignedBuilders.length * speedBoost;

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
    if (this.constructionSiteData.state !== ConstructionStateEnum.NotStarted) {
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
        emitResource(this.gameObject.scene, "resource.removed", productionDefinition.resources);
      } else {
        throw new Error("Cannot afford building costs");
      }
    }

    // start building
    this.remainingConstructionTime = productionDefinition.productionTime;
    this.constructionSiteData.state = ConstructionStateEnum.Constructing;
    this.constructionStateChanged.next(this.constructionSiteData.state);
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

    emitResource(this.gameObject.scene, "resource.added", refundCosts);

    // stop action on builders
    this.assignedBuilders.forEach((builder) => {
      const payerPawnAiController = getActorComponent(builder, PawnAiController);
      payerPawnAiController?.blackboard.resetCurrentOrder();
    });
  }

  get isFinished() {
    return this.constructionSiteData.state === ConstructionStateEnum.Finished;
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

  private tryRepair(delta: number) {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return;

    if (this.assignedRepairers.length === 0) return;
    if (healthComponent.healthComponentData.health >= healthComponent.healthDefinition.maxHealth) return;

    const repairAmount = delta * this.constructionSiteDefinition.repairFactor * this.assignedRepairers.length;
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
    this.constructionSiteData.state = ConstructionStateEnum.Finished;
    this.constructionStateChanged.next(this.constructionSiteData.state);

    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (visibilityComponent && visibilityComponent.visible) {
      const soundDefinitions = SharedActorActionsSfxSelectionSounds;
      const soundDefinition = soundDefinitions[Math.floor(Math.random() * soundDefinitions.length)]!;
      this.audioService?.playSpatialAudioSprite(this.gameObject, soundDefinition.key, soundDefinition.spriteName);
    }

    if (this.constructionSiteDefinition.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        builder.destroy();
      });
    }

    upgradeFromConstructingToFullActorData(this.gameObject);
  }

  private getProgressFraction() {
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    const val = 1 - this.remainingConstructionTime / productionDefinition.productionTime;
    return Math.min(1, Math.max(0, val)); // clamp between 0 and 1
  }

  getData(): ConstructionSiteComponentData {
    return this.constructionSiteData;
  }

  setData(data: Partial<ConstructionSiteComponentData>) {
    this.constructionSiteData = { ...this.constructionSiteData, ...data };
    this.constructionStateChanged.next(this.constructionSiteData.state);
  }

  private onDestroy() {
    this.cancelConstruction();
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
