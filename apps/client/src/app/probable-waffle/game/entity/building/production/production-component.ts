import { IComponent } from '../../../core/component.service';
import { RallyPoint } from '../../../player/rally-point';
import { ActorAbleToBeProduced, ActorAbleToBeProducedClass, ProductionQueue } from './production-queue';
import { CostData } from './production-cost-component';
import { PaymentType } from '../payment-type';
import { PlayerResourcesComponent } from '../../../world/managers/controllers/player-resources-component';
import { OwnerComponent } from '../../actor/components/owner-component';
import { Actor } from '../../actor/actor';
import { SpriteRepresentationComponent } from '../../actor/components/sprite-representable-component';
import { TransformComponent } from '../../actor/components/transformable-component';
import { TilePlacementData } from '../../../world/managers/controllers/input/tilemap/tilemap-input.handler';

export type ProductionQueueItem = {
  actorClass: ActorAbleToBeProducedClass;
  costData: CostData;
};

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
    public availableProductActorClasses: ActorAbleToBeProducedClass[],
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
        const { costData } = queue.queuedActors[j];

        let productionCostPaid = false;
        if (costData.costType == PaymentType.PayOverTime) {
          // get player resources and pay for production
          const playerResourcesComponent =
            this.ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
          const canPayAllResources = playerResourcesComponent.canPayAllResources(costData.resources);

          if (canPayAllResources) {
            playerResourcesComponent.payAllResources(costData.resources);
            productionCostPaid = true;
          }
        } else {
          productionCostPaid = true;
        }

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
    const { actorClass } = queue.queuedActors[queueIndex];

    queue.remainingProductionTime = 0;
    queue.queuedActors.splice(queueIndex, 1);

    // spawn actor
    this.spawnActor(actorClass);
  }

  private spawnActor(actorClass: ActorAbleToBeProducedClass): ActorAbleToBeProduced {
    const tilePlacementData = this.transformComponent.tilePlacementData;

    // offset spawn position
    const spawnPosition: TilePlacementData = {
      // todo demo
      tileXY: {
        x: tilePlacementData.tileXY.x + 1,
        y: tilePlacementData.tileXY.y + 1
      },
      z: tilePlacementData.z
    };

    const actor = new actorClass(
      this.spriteRepresentationComponent.scene,
      spawnPosition,
      this.ownerComponent.playerController
    );
    actor.init(); // todo should be called by registration engine
    actor.start(); // todo should be called by registration engine
    return actor;
  }

  isProducing(): boolean {
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedActors.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * find queue with lest products that is not at capacity
   */
  private findQueueForProduct(): ProductionQueue | undefined {
    let queueWithLeastProducts: ProductionQueue | undefined = undefined;
    let queueWithLeastProductsCount = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedActors.length < queueWithLeastProductsCount) {
        queueWithLeastProducts = queue;
        queueWithLeastProductsCount = queue.queuedActors.length;
      }
    }
    return queueWithLeastProducts;
  }

  private canAssignProduction(item: ProductionQueueItem): boolean {
    // check if actor can be produced
    if (!this.availableProductActorClasses.includes(item.actorClass)) {
      return false;
    }

    // check if queue is not full
    const queue = this.findQueueForProduct();
    // noinspection RedundantIfStatementJS
    if (!queue) {
      return false;
    }

    // check if player has enough resources
    const playerResourcesComponent =
      this.ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
    return playerResourcesComponent.canPayAllResources(item.costData.resources);
  }

  startProduction(queueItem: ProductionQueueItem): void {
    // check production state
    if (!this.canAssignProduction(queueItem)) {
      throw new Error('Cannot assign production');
    }

    // find queue
    const queue = this.findQueueForProduct();
    if (!queue) {
      throw new Error('No queue found');
    }

    // add to queue
    queue.queuedActors.push(queueItem);
    if (queue.queuedActors.length === 1) {
      // start production
      this.startProductionInQueue(queue);
    }
  }

  private startProductionInQueue(queue: ProductionQueue) {
    if (queue.queuedActors.length <= 0) {
      throw new Error('No actor in queue');
    }
    const { costData } = queue.queuedActors[0];

    queue.remainingProductionTime = costData.productionTime;
  }
}
