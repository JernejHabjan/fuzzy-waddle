import { PaymentType } from "../payment-type";
import { ConstructionSiteComponentData, ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../combat/components/health-component";
import { EventEmitter } from "@angular/core";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../actor/components/owner-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { pwActorDefinitions } from "../../../data/actor-definitions";
import { ObjectNames } from "../../../data/object-names";
import { ProductionCostDefinition } from "../production/production-cost-component";
import { onObjectReady } from "../../../data/game-object-helper";
import { BehaviorSubject } from "rxjs";
import GameObject = Phaser.GameObjects.GameObject;
import { upgradeFromConstructingToFullActorData } from "../../../data/actor-data";

export type ConstructionSiteDefinition = {
  // Whether the building site consumes builders when building is finished
  consumesBuilders: boolean;
  maxAssignedBuilders: number;
  // Factor to multiply all passed building time with, independent of any currently assigned builders
  progressMadeAutomatically: number;
  // Factor to multiply all passed building time with, dependent on the number of builders assigned
  progressMadePerBuilder: number;
  initialHealthPercentage: number;
  refundFactor: number;
  // Whether to start building immediately after spawn, or not
  startImmediately: boolean;
  finishedSound?: {
    key: string;
  };
};

export class ConstructionSiteComponent {
  public constructionStarted: EventEmitter<number> = new EventEmitter<number>();
  public progressPercentage = 0;
  public constructionProgressPercentageChanged: BehaviorSubject<number> = new BehaviorSubject<number>(
    this.progressPercentage
  );
  private remainingConstructionTime = 0;
  private constructionSiteData: ConstructionSiteComponentData = {
    state: ConstructionStateEnum.NotStarted
  } satisfies ConstructionSiteComponentData;
  private assignedBuilders: GameObject[] = [];
  private onConstructionFinished: EventEmitter<GameObject> = new EventEmitter<GameObject>();

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
  }

  private get productionDefinition(): ProductionCostDefinition | null {
    const definition = pwActorDefinitions[this.gameObject.name as ObjectNames];
    return definition.components?.productionCost ?? null;
  }

  update(time: number, delta: number): void {
    if (this.constructionSiteData.state == ConstructionStateEnum.Finished) {
      this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      return;
    }
    if (
      this.constructionSiteData.state === ConstructionStateEnum.NotStarted &&
      this.constructionSiteDefinition.startImmediately
    ) {
      this.startConstruction();
    }

    if (this.constructionSiteData.state !== ConstructionStateEnum.Constructing) return;

    const speedBoost = 1.0;
    const constructionProgress =
      delta * this.constructionSiteDefinition.progressMadeAutomatically * speedBoost +
      delta * this.constructionSiteDefinition.progressMadePerBuilder * this.assignedBuilders.length * speedBoost;

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    this.remainingConstructionTime -= constructionProgress;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent) {
      const maxHealth = healthComponent.healthDefinition.maxHealth;
      const initialHealth = maxHealth * this.constructionSiteDefinition.initialHealthPercentage;
      const totalHealthToGain = maxHealth - initialHealth;

      // Calculate health increment based on total health to gain
      const healthIncrement = (totalHealthToGain / productionDefinition.productionTime) * constructionProgress;
      healthComponent.healthComponentData.health += healthIncrement;

      // Handle armor similarly
      const maxArmour = healthComponent.healthDefinition.maxArmour;
      if (maxArmour) {
        const initialArmour = maxArmour * this.constructionSiteDefinition.initialHealthPercentage;
        const totalArmourToGain = maxArmour - initialArmour;
        const armourIncrement = (totalArmourToGain / productionDefinition.productionTime) * constructionProgress;
        healthComponent.healthComponentData.armour += armourIncrement;
      }
    }

    this.progressPercentage = this.getProgressFraction() * 100;
    this.constructionProgressPercentageChanged.next(this.progressPercentage);

    // Check if finished.
    if (this.remainingConstructionTime <= 0) {
      this.finishConstruction();
    }
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

    this.constructionStarted.emit(productionDefinition.productionTime);
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
    if (this.isFinished()) {
      return;
    }
    // refund resources

    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    const owner = ownerComponent?.getOwner();
    if (!owner) throw new Error("Owner not found");
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) throw new Error("PlayerController not found");

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    const TimeRefundFactor =
      productionDefinition.costType === PaymentType.PayImmediately ? this.getProgressFraction() : 1.0;
    const actualRefundFactor = this.constructionSiteDefinition.refundFactor * TimeRefundFactor;

    // refund costs
    const refundCosts: Partial<Record<ResourceType, number>> = {};
    Object.entries(productionDefinition.resources).forEach(([key, value]) => {
      refundCosts[key as ResourceType] = value * actualRefundFactor;
    });

    emitResource(this.gameObject.scene, "resource.added", refundCosts);

    // destroy building
    this.gameObject.destroy();
  }

  isFinished() {
    return this.constructionSiteData.state === ConstructionStateEnum.Finished;
  }

  canAssignBuilder() {
    return this.assignedBuilders.length < this.constructionSiteDefinition.maxAssignedBuilders;
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

  private finishConstruction() {
    this.constructionSiteData.state = ConstructionStateEnum.Finished;
    // todo play sound

    if (this.constructionSiteDefinition.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        builder.destroy();
      });
    }

    upgradeFromConstructingToFullActorData(this.gameObject);

    // todo spawn finished building
    this.onConstructionFinished.emit(this.gameObject);
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
  }

  private onDestroy() {
    this.cancelConstruction();
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
