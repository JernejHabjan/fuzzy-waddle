import { RallyPoint } from "../../../player/rally-point";
import { PaymentType } from "../payment-type";
import { ProductionQueue } from "./production-queue";
import { OwnerComponent } from "../../actor/components/owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { ProductionCostDefinition } from "./production-cost-component";
import { getCommunicator, getPlayer } from "../../../data/scene-data";
import { ActorDefinition, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../../combat/components/health-component";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { SceneActorCreator } from "../../../scenes/components/scene-actor-creator";
import { ObjectNames } from "../../../data/object-names";
import { getGameObjectBounds, getGameObjectTransform } from "../../../data/game-object-helper";
import { SelectableComponent } from "../../actor/components/selectable-component";
import { Subscription } from "rxjs";
import GameObject = Phaser.GameObjects.GameObject;

export type ProductionQueueItem = {
  actorName: ObjectNames;
  costData: ProductionCostDefinition;
};

export type ProductionDefinition = {
  availableProduceActors: ObjectNames[];
  // How many products can be produced simultaneously - for example 2 marines (SC2)
  queueCount: number;
  capacityPerQueue: number;
};

export class ProductionComponent {
  productionQueues: ProductionQueue[] = [];
  rallyPoint: RallyPoint | null = null;
  private ownerComponent!: OwnerComponent;
  private playerChangedSubscription?: Subscription;

  constructor(
    private readonly gameObject: GameObject,
    public readonly productionDefinition: ProductionDefinition
  ) {
    this.listenToMoveEvents();
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

  private listenToMoveEvents() {
    this.playerChangedSubscription = getCommunicator(this.gameObject.scene)
      .playerChanged?.onWithFilter((p) => p.property === "command.issued.move")
      .subscribe((payload) => {
        switch (payload.property) {
          case "command.issued.move":
            const target = payload.data.data!["vec3"] as Vector3Simple;
            const isSelected = getActorComponent(this.gameObject, SelectableComponent)?.getSelected();
            if (isSelected) {
              this.setRallyPointToVec3(target);
            }
            break;
        }
      });
  }

  setRallyPointToVec3(vec3: Vector3Simple) {
    this.rallyPoint = new RallyPoint(vec3);
  }
  setRallyPointToActor(gameObject: GameObject) {
    if (gameObject === this.gameObject) {
      this.rallyPoint = null;
    }
    this.rallyPoint = new RallyPoint(null, gameObject);
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

  startProduction(queueItem: ProductionQueueItem): AssignProductionErrorCode | null {
    const productionState = this.canAssignProduction(queueItem);
    if (productionState) {
      return productionState;
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

    return null;
  }

  private finishProduction(queue: ProductionQueue, queueIndex: number) {
    if (queueIndex >= queue.queuedItems.length) {
      throw new Error("Invalid queue index");
    }
    const { actorName } = queue.queuedItems[queueIndex];

    queue.remainingProductionTime = 0;
    queue.queuedItems.splice(queueIndex, 1);

    // spawn gameObject

    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) throw new Error("Transform not found");
    const tilePlacementData = { x: transform.x, y: transform.y, z: transform.z } satisfies Vector3Simple;

    // offset spawn position
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) throw new Error("Bounds not found");
    const { width, height } = bounds;

    const spawnPosition: Vector3Simple = {
      x: tilePlacementData.x + width / 2,
      y: tilePlacementData.y + height / 4,
      z: tilePlacementData.z
    };

    const originalOwner = this.ownerComponent.getOwner();

    const actorDefinition = {
      name: actorName,
      x: spawnPosition.x,
      y: spawnPosition.y,
      ...(spawnPosition.z && { z: spawnPosition.z }),
      ...(originalOwner && { owner: originalOwner })
    } as ActorDefinition;

    const sceneActorCreator = getSceneService(this.gameObject.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");
    const newGameObject = sceneActorCreator.createActorFromDefinition(actorDefinition);
    if (newGameObject && this.rallyPoint) {
      this.rallyPoint.navigateGameObjectToRallyPoint(newGameObject);
    }
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

  private canAssignProduction(item: ProductionQueueItem): AssignProductionErrorCode | null {
    // check if gameObject can be produced
    if (!this.productionDefinition.availableProduceActors.includes(item.actorName))
      return AssignProductionErrorCode.InvalidProduct;

    // check if queue is not full
    const queue = this.findQueueForProduct();
    // noinspection RedundantIfStatementJS
    if (!queue) return AssignProductionErrorCode.QueueFull;

    const owner = this.ownerComponent.getOwner();
    if (!owner) return AssignProductionErrorCode.NoOwner;

    // check if player has enough resources
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) return AssignProductionErrorCode.NoOwner;

    const canPayAllResources = player.canPayAllResources(item.costData.resources);
    if (!canPayAllResources) return AssignProductionErrorCode.NotEnoughResources;

    return null;
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
    this.playerChangedSubscription?.unsubscribe();
  }
}

export enum AssignProductionErrorCode {
  NotEnoughResources = 1,
  QueueFull = 2,
  InvalidProduct = 3,
  NoOwner = 4
}
