import { PaymentType } from "../payment-type";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ConstructionStateEnum } from "./construction-state-enum";
import { HealthComponent } from "../../combat/components/health-component";
import { EventEmitter } from "@angular/core";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../actor/components/owner-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import GameObject = Phaser.GameObjects.GameObject;
import { pwActorDefinitions } from "../../../data/actor-definitions";
import { ObjectNames } from "../../../data/object-names";
import { ProductionCostDefinition } from "../production/production-cost-component";

export type ConstructionSiteDefinition = {
  // Whether the building site consumes builders when building is finished
  consumesBuilders: boolean;
  maxAssignedBuilders: number;
  // Factor to multiply all passed building time with, independent of any currently assigned builders
  progressMadeAutomatically: number;
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
  public constructionProgressChanged: EventEmitter<number> = new EventEmitter<number>();
  private remainingConstructionTime = 0;
  private state: ConstructionStateEnum = ConstructionStateEnum.NotStarted;
  private assignedBuilders: GameObject[] = [];
  private onConstructionFinished: EventEmitter<GameObject> = new EventEmitter<GameObject>();

  constructor(
    private readonly gameObject: GameObject,
    private readonly constructionSiteDefinition: ConstructionSiteDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
  }

  private get productionDefinition(): ProductionCostDefinition | null {
    const definition = pwActorDefinitions[this.gameObject.name as ObjectNames];
    return definition.components?.productionCost ?? null;
  }

  update(time: number, delta: number): void {
    if (this.state == ConstructionStateEnum.Finished) {
      this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      return;
    }
    if (this.state === ConstructionStateEnum.NotStarted && this.constructionSiteDefinition.startImmediately) {
      this.startConstruction();
    }

    const speedBoost = 1.0;
    // float ConstructionProgress =
    //   (DeltaTime * ProgressMadeAutomatically * speedBoost) +
    //   (DeltaTime * ProgressMadePerBuilder * AssignedBuilders.Num() * speedBoost);
    const constructionProgress =
      delta * this.constructionSiteDefinition.progressMadeAutomatically * speedBoost +
      delta * this.constructionSiteDefinition.progressMadePerBuilder * this.assignedBuilders.length * speedBoost;

    // todo other logic here

    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");

    this.remainingConstructionTime -= constructionProgress;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent) {
      const currentHealth = healthComponent.healthComponentData.health;
      const maxHealth = healthComponent.healthDefinition.maxHealth;
      const healthIncrement =
        ((maxHealth - currentHealth) / productionDefinition.productionTime) * constructionProgress;
      healthComponent.healthComponentData.health += healthIncrement;
    }

    this.constructionProgressChanged.emit(this.remainingConstructionTime / productionDefinition.productionTime);

    // Check if finished.
    if (this.remainingConstructionTime <= 0) {
      this.finishConstruction();
    }
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
        emitResource(this.gameObject.scene, "resource.removed", productionDefinition.resources);
      } else {
        throw new Error("Cannot afford building costs");
      }
    }

    // start building
    this.remainingConstructionTime = productionDefinition.productionTime;
    this.state = ConstructionStateEnum.Constructing;

    // set initial health
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (healthComponent) {
      healthComponent.healthComponentData.health = Math.floor(
        healthComponent.healthDefinition.maxHealth * this.constructionSiteDefinition.initialHealthPercentage
      );
    }

    this.constructionStarted.emit(productionDefinition.productionTime);
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
      productionDefinition.costType === PaymentType.PayImmediately ? this.getProgressPercentage() : 1.0;
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
    return this.state === ConstructionStateEnum.Finished;
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
    this.state = ConstructionStateEnum.Finished;
    // todo play sound

    if (this.constructionSiteDefinition.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        builder.destroy();
      });
    }

    // todo spawn finished building
    this.onConstructionFinished.emit(this.gameObject);
  }

  private getProgressPercentage() {
    const productionDefinition = this.productionDefinition;
    if (!productionDefinition) throw new Error("Production definition not found");
    return 1 - this.remainingConstructionTime / productionDefinition.productionTime;
  }

  private onDestroy() {
    this.cancelConstruction();
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
