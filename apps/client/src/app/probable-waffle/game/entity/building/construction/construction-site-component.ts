import { IComponent } from "../../../core/component.service";
import { PaymentType } from "../payment-type";
import { ResourceTypeDefinition } from "@fuzzy-waddle/api-interfaces";
import { Actor } from "../../actor/actor";
import { DEPRECATEDownerComponent } from "../../actor/components/DEPRECATEDowner-component";
import { PlayerResourcesComponent } from "../../../world/managers/controllers/player-resources-component";
import { ConstructionStateEnum } from "./construction-state-enum";
import { HealthComponent } from "../../combat/components/health-component";
import { EventEmitter } from "@angular/core";

export type ConstructionSiteDefinition = {
  constructionCosts: Map<ResourceTypeDefinition, number>;
  // Whether to check collision for each grid cell
  checkCollision: boolean;
  constructionCostType: PaymentType;
  constructionTime: number;
  consumesBuilders: boolean;
  maxAssignedBuilders: number;
  // Factor to multiply all passed building time with, independent of any currently assigned builders
  progressMadeAutomatically: number;
  progressMadePerBuilder: number;
  initialHealthPercentage: number;
  refundFactor: number;
  // Whether to start building immediately after spawn, or not
  startImmediately: boolean;
  gridWidthAndHeight: { width: number; height: number };
  finishedSound?: string;
};

export class ConstructionSiteComponent implements IComponent {
  public constructionStarted: EventEmitter<number> = new EventEmitter<number>();
  public constructionProgressChanged: EventEmitter<number> = new EventEmitter<number>();
  private remainingConstructionTime = 0;
  private state: ConstructionStateEnum = ConstructionStateEnum.NotStarted;
  private assignedBuilders: Actor[] = [];
  private onConstructionFinished: EventEmitter<Actor> = new EventEmitter<Actor>();

  constructor(
    private owner: Actor,
    private constructionSiteDefinition: ConstructionSiteDefinition
  ) {}

  init(): void {
    // pass
  }

  update(time: number, delta: number): void {
    if (this.state === ConstructionStateEnum.NotStarted && this.constructionSiteDefinition.startImmediately) {
      this.startConstruction();
    } else if (this.state == ConstructionStateEnum.Finished) {
      return;
    }

    const SpeedBoostFactor = 1.0;
    // float ConstructionProgress =
    //   (DeltaTime * ProgressMadeAutomatically * SpeedBoostFactor) +
    //   (DeltaTime * ProgressMadePerBuilder * AssignedBuilders.Num() * SpeedBoostFactor);
    const constructionProgress =
      delta * this.constructionSiteDefinition.progressMadeAutomatically * SpeedBoostFactor +
      delta * this.constructionSiteDefinition.progressMadePerBuilder * this.assignedBuilders.length * SpeedBoostFactor;

    // todo other logic here

    this.remainingConstructionTime -= constructionProgress;
    const healthComponent = this.owner.components.findComponentOrNull(HealthComponent);
    if (healthComponent) {
      const currentHealth = healthComponent.getCurrentHealth();
      const maxHealth = healthComponent.healthDefinition.maxHealth;
      const healthIncrement =
        ((maxHealth - currentHealth) / this.constructionSiteDefinition.constructionTime) * constructionProgress;
      healthComponent.setCurrentHealth(currentHealth + healthIncrement);
    }

    this.constructionProgressChanged.emit(
      this.remainingConstructionTime / this.constructionSiteDefinition.constructionTime
    );

    // Check if finished.
    if (this.remainingConstructionTime <= 0) {
      this.finishConstruction();
    }
  }

  startConstruction() {
    if (this.state !== ConstructionStateEnum.NotStarted) {
      throw new Error("ConstructionSiteComponent can only be started once");
    }
    if (this.constructionSiteDefinition.constructionCostType === PaymentType.PayImmediately) {
      const ownerComponent = this.owner.components.findComponent(DEPRECATEDownerComponent);
      if (!ownerComponent.playerController) throw new Error("PlayerController not found");
      const playerResourcesComponent =
        ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
      const canAfford = playerResourcesComponent.canPayAllResources(this.constructionSiteDefinition.constructionCosts);
      if (canAfford) {
        playerResourcesComponent.payAllResources(this.constructionSiteDefinition.constructionCosts);
      } else {
        throw new Error("Cannot afford building costs");
      }
    }

    // start building
    this.remainingConstructionTime = this.constructionSiteDefinition.constructionTime;
    this.state = ConstructionStateEnum.Constructing;

    // set initial health
    const healthComponent = this.owner.components.findComponentOrNull(HealthComponent);
    if (healthComponent) {
      healthComponent.setCurrentHealth(
        healthComponent.healthDefinition.maxHealth * this.constructionSiteDefinition.initialHealthPercentage
      );
    }

    this.constructionStarted.emit(this.constructionSiteDefinition.constructionTime);
  }

  cancelConstruction() {
    if (this.isFinished()) {
      return;
    }
    // refund resources

    const ownerComponent = this.owner.components.findComponent(DEPRECATEDownerComponent);
    if (!ownerComponent.playerController) throw new Error("PlayerController not found");
    const playerResourcesComponent = ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);

    const TimeRefundFactor =
      this.constructionSiteDefinition.constructionCostType === PaymentType.PayImmediately
        ? this.getProgressPercentage()
        : 1.0;
    const actualRefundFactor = this.constructionSiteDefinition.refundFactor * TimeRefundFactor;

    // refund costs
    const refundCosts = new Map<ResourceTypeDefinition, number>();
    this.constructionSiteDefinition.constructionCosts.forEach((value, key) => {
      refundCosts.set(key, value * actualRefundFactor);
    });

    playerResourcesComponent.addResources(refundCosts);

    // destroy building
    this.owner.kill();
  }

  isFinished() {
    return this.state === ConstructionStateEnum.Finished;
  }

  canAssignBuilder() {
    return this.assignedBuilders.length < this.constructionSiteDefinition.maxAssignedBuilders;
  }

  assignBuilder(actor: Actor) {
    this.assignedBuilders.push(actor);
  }

  unAssignBuilder(actor: Actor) {
    const index = this.assignedBuilders.indexOf(actor);
    if (index >= 0) {
      this.assignedBuilders.splice(index, 1);
    }
  }

  private finishConstruction() {
    this.state = ConstructionStateEnum.Finished;
    // todo play sound

    if (this.constructionSiteDefinition.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        // todo also somehow else destroy???
        builder.destroy();
      });
    }

    // todo spawn finished building
    this.onConstructionFinished.emit(this.owner);
  }

  private getProgressPercentage() {
    return 1 - this.remainingConstructionTime / this.constructionSiteDefinition.constructionTime;
  }
}
