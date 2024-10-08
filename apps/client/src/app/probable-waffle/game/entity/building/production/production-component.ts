import { RallyPoint } from "../../../player/rally-point";
import { PaymentType } from "../payment-type";
import { ProductionQueue } from "./production-queue";
import { OwnerComponent } from "../../actor/components/owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionCostDefinition } from "./production-cost-component";
import { getPlayer } from "../../../data/scene-data";
import GameObject = Phaser.GameObjects.GameObject;
import { ActorDefinition, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../combat/components/health-component";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { SceneActorCreator } from "../../../scenes/components/scene-actor-creator";

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
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.init, this);
  }

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
          const owner = this.ownerComponent.getOwner();
          if (!owner) {
            throw new Error("Owner not found");
          }
          const player = getPlayer(this.gameObject.scene, owner);
          if (!player) {
            throw new Error("PlayerController not found");
          }
          // get player resources and pay for production
          const canPayAllResources = player.canPayAllResources(costData.resources);

          if (canPayAllResources) {
            player.payAllResources(costData.resources);
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

    const transform = this.gameObject as unknown as Phaser.GameObjects.Components.Transform; // todo this is used on multiple places
    if (!transform) throw new Error("Transform not found" + this.gameObject);
    const tilePlacementData = { x: transform.x, y: transform.y, z: transform.z } satisfies Vector3Simple;

    // offset spawn position
    const spawnPosition: Vector3Simple = {
      // todo demo
      x: tilePlacementData.x + 1,
      y: tilePlacementData.y + 1,
      z: tilePlacementData.z
    };

    const originalOwner = this.ownerComponent.getOwner();

    const actorDefinition = {
      name: gameObjectClass,
      x: spawnPosition.x,
      y: spawnPosition.y,
      ...(spawnPosition.z && { z: spawnPosition.z }),
      ...(originalOwner && { owner: originalOwner })
    } as ActorDefinition;

    const sceneActorCreator = getSceneService(this.gameObject.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");
    sceneActorCreator.createActorFromDefinition(actorDefinition);
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
    if (!this.productionDefinition.availableProductGameObjectClasses.includes(item.gameObjectClass)) return false;

    // check if queue is not full
    const queue = this.findQueueForProduct();
    // noinspection RedundantIfStatementJS
    if (!queue) return false;

    const owner = this.ownerComponent.getOwner();
    if (!owner) return false;

    // check if player has enough resources
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) return false;

    return player.canPayAllResources(item.costData.resources);
  }

  private startProductionInQueue(queue: ProductionQueue) {
    if (queue.queuedItems.length <= 0) {
      throw new Error("No gameObject in queue");
    }
    const { costData } = queue.queuedItems[0];

    queue.remainingProductionTime = costData.productionTime;
  }

  private destroy() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
