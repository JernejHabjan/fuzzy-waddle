import { IComponent } from '../services/component.service';
import { RallyPoint } from '../rally-point';
import { ActorsAbleToBeProduced, ActorsAbleToBeProducedClass, ProductionQueue } from './production-queue';
import { ProductionCostComponent } from './production-cost-component';
import { PaymentType } from './payment-type';
import { PlayerResourcesComponent } from '../controllers/player-resources-component';
import { OwnerComponent } from '../characters/owner-component';
import { Actor } from '../actor';
import { SpriteRepresentationComponent } from '../characters/sprite-representable-component';
import { TransformComponent } from '../characters/transformable-component';

export interface Producer {
  productionComponent: ProductionComponent;
}

export class ProductionComponent implements IComponent {
  productionQueues: ProductionQueue[] = [];
  rallyPoint?: RallyPoint;
  private ownerComponent!: OwnerComponent;
  private spriteRepresentationComponent!: SpriteRepresentationComponent;
  private transformComponent!: TransformComponent;

  constructor(
    private readonly owner: Actor,
    public availableProductActorClasses: ActorsAbleToBeProducedClass[],
    // How many products can be produced simultaneously - for example 2 marines (SC2)
    private queueCount: number,
    private capacityPerQueue: number
  ) {}

  init() {
    this.ownerComponent = this.owner.components.findComponent(OwnerComponent);
    this.spriteRepresentationComponent = this.owner.components.findComponent(SpriteRepresentationComponent);
    this.transformComponent = this.owner.components.findComponent(TransformComponent);
    // setup queues
    for (let i = 0; i < this.queueCount; i++) {
      this.productionQueues.push(new ProductionQueue(this.capacityPerQueue));
    }
  }

  update(time: number, delta: number): void {
    // process all queues
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedActors.length <= 0) {
        continue;
      }

      for (let j = 0; j < queue.queuedActors.length; j++) {
        const actorClass = queue.queuedActors[j];

        const tempActor = this.spawnActorTemp(actorClass);
        tempActor.init(); // todo should be called by registration engine
        tempActor.start(); // todo should be called by registration engine
        const productionCostComponent = tempActor.components.findComponentOrNull(ProductionCostComponent);
        let productionCostPaid = false;
        if (productionCostComponent && productionCostComponent.costType == PaymentType.PayOverTime) {
          // get player resources and pay for production
          const playerResourcesComponent =
            this.ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
          const canPayAllResources = playerResourcesComponent.canPayAllResources(productionCostComponent.resources);

          if (canPayAllResources) {
            playerResourcesComponent.spendPlayerResources(productionCostComponent.resources);
            productionCostPaid = true;
          }
        } else {
          productionCostPaid = true;
        }
        tempActor.destroy();

        if (!productionCostPaid) {
          continue;
        }

        // update production progress
        queue.remainingProductionTime -= delta;

        // check if production is ready

        if (queue.remainingProductionTime <= 0) {
          this.finishProduction(queue, j);
        }
      }
    }
  }

  private finishProduction(queue: ProductionQueue, queueIndex: number) {
    if (queueIndex >= queue.queuedActors.length) {
      throw new Error('Invalid queue index');
    }
    queue.remainingProductionTime = 0;

    // spawn actor
    const actorClass = queue.queuedActors[queueIndex];
    this.spawnActor(actorClass);
  }

  private spawnActor(actorClass: ActorsAbleToBeProducedClass): ActorsAbleToBeProduced {
    const tilePlacementData = this.transformComponent.tilePlacementData;
    const actor = new actorClass(
      this.spriteRepresentationComponent.scene,
      tilePlacementData,
      this.ownerComponent.playerController
    );
    actor.init(); // todo should be called by registration engine
    actor.start(); // todo should be called by registration engine
    return actor;
  }

  private spawnActorTemp(actorClass: ActorsAbleToBeProducedClass): ActorsAbleToBeProduced {
    return this.spawnActor(actorClass); // todo!!!!
  }
}
