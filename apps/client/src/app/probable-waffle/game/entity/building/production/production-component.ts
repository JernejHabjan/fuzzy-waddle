import { RallyPoint } from "../../../player/rally-point";
import { PaymentType } from "../payment-type";
import { PlayerResourcesComponent } from "../../../world/managers/controllers/player-resources-component";
import { ProductionQueue } from "./production-queue";
import { OwnerComponent } from "../../actor/components/owner-component";
import { getActorComponent } from "../../../data/actor-component";
import GameObject = Phaser.GameObjects.GameObject;
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { ProductionCostDefinition } from "./production-cost-component";

export type ProductionQueueItem = {
  gameObjectClass: string;
  costData: ProductionCostDefinition;
};

export type ProductionDefinition = {
  availableProductGameObjectClasses: string[];
  // How many products can be produced simultaneously - for example 2 marines (SC2)
  queueCount: number;
  capacityPerQueue: number;
};

export class ProductionComponent {
  productionQueues: ProductionQueue[] = [];
  rallyPoint?: RallyPoint;
  private ownerComponent!: OwnerComponent;

  constructor(
    private readonly gameObject: GameObject,
    public readonly productionDefinition: ProductionDefinition
  ) {}

  init() {
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent)!;
    // setup queues
    for (let i = 0; i < this.productionDefinition.queueCount; i++) {
      this.productionQueues.push(new ProductionQueue(this.productionDefinition.capacityPerQueue));
    }
  }

  update(time: number, delta: number): void {
    // process all queues
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedItems.length <= 0) {
        continue;
      }

      for (let j = 0; j < queue.queuedItems.length; j++) {
        const { costData } = queue.queuedItems[j];

        let productionCostPaid = false;
        if (costData.costType == PaymentType.PayOverTime) {
          if (!this.ownerComponent.playerController) {
            throw new Error("Player controller not found");
          }
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

  isProducing(): boolean {
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedItems.length > 0) {
        return true;
      }
    }
    return false;
  }

  startProduction(queueItem: ProductionQueueItem): void {
    // check production state
    if (!this.canAssignProduction(queueItem)) {
      throw new Error("Cannot assign production");
    }

    // find queue
    const queue = this.findQueueForProduct();
    if (!queue) {
      throw new Error("No queue found");
    }

    // add to queue
    queue.queuedItems.push(queueItem);
    if (queue.queuedItems.length === 1) {
      // start production
      this.startProductionInQueue(queue);
    }
  }

  private finishProduction(queue: ProductionQueue, queueIndex: number) {
    if (queueIndex >= queue.queuedItems.length) {
      throw new Error("Invalid queue index");
    }
    const { gameObjectClass } = queue.queuedItems[queueIndex];

    queue.remainingProductionTime = 0;
    queue.queuedItems.splice(queueIndex, 1);

    // spawn gameObject
    this.spawnGameObject(gameObjectClass);
  }

  private spawnGameObject(gameObjectClass: string): any {
    const transform = this.gameObject as unknown as Phaser.GameObjects.Components.Transform;
    if (!transform) throw new Error("Transform not found" + this.gameObject);
    const tilePlacementData = { x: transform.x, y: transform.y, z: transform.z } satisfies Vector3Simple;

    // offset spawn position
    const spawnPosition: Vector3Simple = {
      // todo demo
      x: tilePlacementData.x + 1,
      y: tilePlacementData.y + 1,
      z: tilePlacementData.z
    };

    const gameObject = new gameObjectClass(this.spriteRepresentationComponent.scene, spawnPosition);
    gameObject.registerGameObject(); // todo should be called by registration engine
    gameObject.possess(this.ownerComponent.playerController);
    return gameObject;
  }

  /**
   * find queue with lest products that is not at capacity
   */
  private findQueueForProduct(): ProductionQueue | undefined {
    let queueWithLeastProducts: ProductionQueue | undefined = undefined;
    let queueWithLeastProductsCount = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedItems.length < queueWithLeastProductsCount) {
        queueWithLeastProducts = queue;
        queueWithLeastProductsCount = queue.queuedItems.length;
      }
    }
    return queueWithLeastProducts;
  }

  private canAssignProduction(item: ProductionQueueItem): boolean {
    // check if gameObject can be produced
    if (!this.productionDefinition.availableProductGameObjectClasses.includes(item.gameObjectClass)) {
      return false;
    }

    // check if queue is not full
    const queue = this.findQueueForProduct();
    // noinspection RedundantIfStatementJS
    if (!queue) {
      return false;
    }

    // check if player has enough resources
    if (!this.ownerComponent.playerController) throw new Error("Player controller not found");
    const playerResourcesComponent =
      this.ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
    return playerResourcesComponent.canPayAllResources(item.costData.resources);
  }

  private startProductionInQueue(queue: ProductionQueue) {
    if (queue.queuedItems.length <= 0) {
      throw new Error("No gameObject in queue");
    }
    const { costData } = queue.queuedItems[0];

    queue.remainingProductionTime = costData.productionTime;
  }
}
