import { IComponent } from '../services/component.service';
import { PaymentType } from './payment-type';
import { ResourceType } from './resource-type';
import { Actor } from '../actor';
import { OwnerComponent } from '../characters/owner-component';
import { PlayerResourcesComponent } from '../controllers/player-resources-component';
import { ConstructionStateEnum } from './construction-state-enum';
import HealthComponent from '../characters/combat/health-component';
import { EventEmitter } from '@angular/core';

export class ConstructionSiteComponent implements IComponent {
  private remainingConstructionTime = 0;
  private playerResourcesComponent: PlayerResourcesComponent;
  private state: ConstructionStateEnum = ConstructionStateEnum.NotStarted;
  private assignedBuilders: Actor[] = [];
  public constructionStarted: EventEmitter<number> = new EventEmitter<number>();
  public constructionProgressChanged: EventEmitter<number> = new EventEmitter<number>();
  private onConstructionFinished: EventEmitter<Actor> = new EventEmitter<Actor>();

  constructor(
    private owner: Actor,
    // Whether to check collision for each grid cell
    private readonly constructionCosts: Map<ResourceType, number>,
    private readonly checkCollision: boolean,
    private readonly constructionCostType: PaymentType,
    private readonly constructionType: ResourceType,
    private readonly constructionTime: number,
    private readonly consumesBuilders: boolean,
    private readonly maxAssignedBuilders: boolean,
    // Factor to multiply all passed construction time with, independent of any currently assigned builders
    private readonly progressMadeAutomatically: number,
    private readonly progressMadePerBuilder: number,
    private readonly initialHealthPercentage: number,
    private readonly refundFactor: number,
    // Whether to start construction immediately after spawn, or not
    private readonly startImmediately: boolean,
    readonly gridWidthAndHeight: { width: number; height: number },
    private readonly finishedSound?: string
  ) {
    const ownerComponent = this.owner.components.findComponent(OwnerComponent);
    this.playerResourcesComponent = ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
  }

  init(): void {
    // pass
  }

  update(time: number, delta: number): void {
    if (this.state == ConstructionStateEnum.NotStarted && this.startImmediately) {
      this.startConstruction();
    } else if (this.state == ConstructionStateEnum.Finished) {
      return;
    }

    const SpeedBoostFactor = 1.0;
    // float ConstructionProgress =
    //   (DeltaTime * ProgressMadeAutomatically * SpeedBoostFactor) +
    //   (DeltaTime * ProgressMadePerBuilder * AssignedBuilders.Num() * SpeedBoostFactor);
    const constructionProgress =
      delta * this.progressMadeAutomatically * SpeedBoostFactor +
      delta * this.progressMadePerBuilder * this.assignedBuilders.length * SpeedBoostFactor;

    // todo other logic here

    this.remainingConstructionTime -= constructionProgress;
    const healthComponent = this.owner.components.findComponentOrNull(HealthComponent);
    if (healthComponent) {
      const currentHealth = healthComponent.getCurrentHealth();
      const maxHealth = healthComponent.healthDefinition.maxHealth;
      const healthIncrement = ((maxHealth - currentHealth) / this.constructionTime) * constructionProgress;
      healthComponent.setCurrentHealth(currentHealth + healthIncrement);
    }

    this.constructionProgressChanged.emit(this.remainingConstructionTime / this.constructionTime);

    // Check if finished.
    if (this.remainingConstructionTime <= 0) {
      this.finishConstruction();
    }
  }
  startConstruction() {
    if (this.state !== ConstructionStateEnum.NotStarted) {
      throw new Error('ConstructionSiteComponent can only be started once');
    }
    if (this.constructionCostType === PaymentType.PayImmediately) {
      const canAfford = this.playerResourcesComponent.canPayAllResources(this.constructionCosts);
      if (canAfford) {
        this.playerResourcesComponent.spendPlayerResources(this.constructionCosts);
      } else {
        throw new Error('Cannot afford construction costs');
      }
    }

    // start construction
    this.remainingConstructionTime = this.constructionTime;
    this.state = ConstructionStateEnum.Constructing;

    // set initial health
    const healthComponent = this.owner.components.findComponentOrNull(HealthComponent);
    if (healthComponent) {
      healthComponent.setCurrentHealth(healthComponent.healthDefinition.maxHealth * this.initialHealthPercentage);
    }

    this.constructionStarted.emit(this.constructionTime);
  }

  private finishConstruction() {
    this.state = ConstructionStateEnum.Finished;
    // todo play sound

    if (this.consumesBuilders) {
      this.assignedBuilders.forEach((builder) => {
        // todo also somehow else destroy???
        builder.destroy();
      });
    }

    // todo spawn finished building
    this.onConstructionFinished.emit(this.owner);
  }
}
