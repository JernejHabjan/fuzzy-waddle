import { PaymentType } from "../../building/payment-type";
import { ProductionQueue } from "./production-queue";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { type ProductionCostDefinition } from "./production-cost-component";
import { emitResource, getCommunicator, getCurrentPlayerNumber, getPlayer } from "../../../data/scene-data";
import {
  type ActorDefinition,
  ConstructionStateEnum,
  ObjectNames,
  type ProductionComponentData,
  ResourceType,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import { getSceneService } from "../../../world/components/scene-component-helpers";
import { SceneActorCreator } from "../../../world/components/scene-actor-creator";
import {
  getGameObjectBounds,
  getGameObjectLogicalTransform,
  getGameObjectVisibility,
  onObjectReady
} from "../../../data/game-object-helper";
import { SelectableComponent } from "../selectable-component";
import { Subject, Subscription } from "rxjs";
import RallyPoint from "../../../prefabs/buildings/misc/RallyPoint";
import { ConstructionSiteComponent } from "../construction/construction-site-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import GameObject = Phaser.GameObjects.GameObject;

export type ProductionQueueItem = {
  actorName: ObjectNames;
  costData: ProductionCostDefinition;
};

export type ProductionProgressEvent = {
  queueIndex: number;
  queueItemIndex: number;
  progressInPercentage: number;
};
export type ProductionQueueChangeEvent = {
  itemsFromAllQueues: ProductionQueueItem[];
  type: "add" | "remove" | "completed";
};

export type ProductionDefinition = {
  availableProduceActors: ObjectNames[];
  // How many products can be produced simultaneously - for example 2 marines (SC2)
  queueCount: number;
  capacityPerQueue: number;
};

export class ProductionComponent {
  productionQueues: ProductionQueue[] = [];
  private rallyPoint: RallyPoint = new RallyPoint(this.gameObject.scene);
  private ownerComponent!: OwnerComponent;
  private playerChangedSubscription?: Subscription;
  private productionProgressSubject = new Subject<ProductionProgressEvent>();
  private queueChangeSubject = new Subject<ProductionQueueChangeEvent>();
  constructor(
    private readonly gameObject: GameObject,
    public readonly productionDefinition: ProductionDefinition
  ) {
    this.init();
    this.listenToMoveEvents();
    onObjectReady(gameObject, this.initOnObjectReady, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  init() {
    // setup queues
    for (let i = 0; i < this.productionDefinition.queueCount; i++) {
      this.productionQueues.push(new ProductionQueue(this.productionDefinition.capacityPerQueue));
    }
  }

  initOnObjectReady() {
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent)!;
    this.rallyPoint.init(this.gameObject);
  }

  get productionProgressObservable() {
    return this.productionProgressSubject.asObservable();
  }

  get queueChangeObservable() {
    return this.queueChangeSubject.asObservable();
  }

  get itemsFromAllQueues() {
    return this.productionQueues.reduce((acc, queue) => acc.concat(queue.queuedItems), [] as ProductionQueueItem[]);
  }

  get isFinished() {
    return getActorComponent(this.gameObject, ConstructionSiteComponent)?.isFinished ?? true;
  }

  update(time: number, delta: number): void {
    if (!this.isFinished) return;
    // process all queues
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;
      if (queue.queuedItems.length <= 0) {
        continue;
      }

      for (let j = 0; j < queue.queuedItems.length; j++) {
        const { costData } = queue.queuedItems[j]!;

        let productionCostPaid = false;
        if (costData.costType == PaymentType.PayOverTime) {
          productionCostPaid = this.handlePayOverTimePayment(costData.resources);
        } else {
          productionCostPaid = true;
        }

        if (!productionCostPaid) {
          continue;
        }

        // update production progress
        queue.remainingProductionTime -= delta;
        queue.remainingProductionTime = Math.max(queue.remainingProductionTime, 0);

        const progress = ((costData.productionTime - queue.remainingProductionTime) / costData.productionTime) * 100;

        // Emit progress event
        this.productionProgressSubject.next({
          queueIndex: i,
          queueItemIndex: j,
          progressInPercentage: Math.min(progress, 100) // Ensure progress doesn't exceed 100%
        });

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
            const tileVec3 = payload.data.data!["tileVec3"] as Vector3Simple;
            const worldVec3 = payload.data.data!["worldVec3"] as Vector3Simple;
            const isSelected = getActorComponent(this.gameObject, SelectableComponent)?.getSelected();
            if (isSelected && this.canIssueCommand()) {
              this.rallyPoint.setLocation(tileVec3, worldVec3);
            }
            break;
        }
      });
  }

  get isProducing(): boolean {
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;
      if (queue.queuedItems.length > 0) {
        return true;
      }
    }
    return false;
  }

  get isIdle() {
    return !this.isProducing;
  }

  getCurrentProgress() {
    if (!this.isProducing) return null;

    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;
      if (queue.queuedItems.length > 0) {
        const { costData } = queue.queuedItems[0]!;
        return 100 - (queue.remainingProductionTime / costData.productionTime) * 100;
      }
    }
    return null;
  }

  startProduction(queueItem: ProductionQueueItem): AssignProductionErrorCode | null {
    if (!this.isFinished) return AssignProductionErrorCode.NotFinished;
    const productionState = this.canAssignProduction(queueItem);
    if (productionState) {
      return productionState;
    }

    // find queue
    const queue = this.findQueueForProduct();
    if (!queue) {
      throw new Error("No queue found");
    }

    this.handleImmediatePayment(queueItem);

    // add to queue
    queue.queuedItems.push(queueItem);
    this.queueChangeSubject.next({
      itemsFromAllQueues: this.itemsFromAllQueues,
      type: "add"
    });

    if (queue.queuedItems.length === 1) {
      // start production
      this.resetQueue(queue);
    }

    return null;
  }

  private handleImmediatePayment(queueItem: ProductionQueueItem): void {
    if (queueItem.costData.costType === PaymentType.PayImmediately) {
      const owner = this.ownerComponent.getOwner();
      if (!owner) return;

      const player = getPlayer(this.gameObject.scene, owner);
      if (!player) return;

      // Fully pay for the production item
      emitResource(this.gameObject.scene, "resource.removed", queueItem.costData.resources);
    }
  }

  private handlePayOverTimePayment(resources: Partial<Record<ResourceType, number>>): boolean {
    const owner = this.ownerComponent.getOwner();
    if (!owner) {
      throw new Error("Owner not found");
    }
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) {
      throw new Error("PlayerController not found");
    }
    // get player resources and pay for production
    const canPayAllResources = player.canPayAllResources(resources);

    let productionCostPaid = false;
    if (canPayAllResources) {
      emitResource(this.gameObject.scene, "resource.removed", resources);
      productionCostPaid = true;
    }

    return productionCostPaid;
  }

  private finishProduction(queue: ProductionQueue, queueIndex: number) {
    if (queueIndex >= queue.queuedItems.length) {
      throw new Error("Invalid queue index");
    }
    const { actorName } = queue.queuedItems[queueIndex]!;

    queue.queuedItems.splice(queueIndex, 1);
    this.resetQueue(queue);
    this.queueChangeSubject.next({
      itemsFromAllQueues: this.itemsFromAllQueues,
      type: "completed"
    });

    // spawn gameObject

    const logicalTransform = getGameObjectLogicalTransform(this.gameObject);
    if (!logicalTransform) throw new Error("Transform not found");

    // offset spawn position
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) throw new Error("Bounds not found");
    const { width, height } = bounds;

    const spawnPosition: Vector3Simple = {
      x: logicalTransform.x + width / 2,
      y: logicalTransform.y + height / 4,
      z: logicalTransform.z
    };

    const originalOwner = this.ownerComponent.getOwner();

    const actorDefinition = {
      name: actorName,
      representable: {
        logicalWorldTransform: spawnPosition
      },
      ...(originalOwner && {
        owner: {
          ownerId: originalOwner
        }
      }),
      constructionSite: {
        state: ConstructionStateEnum.Finished
      }
    } satisfies ActorDefinition;

    const sceneActorCreator = getSceneService(this.gameObject.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");
    const newGameObject = sceneActorCreator.createActorFromDefinition(actorDefinition);
    if (newGameObject) {
      // hide by default - fog-of-war will show it if visible for player
      const visibilityComponent = getGameObjectVisibility(newGameObject);
      if (visibilityComponent) visibilityComponent.setVisible(false);

      if (this.rallyPoint.isSet()) {
        // noinspection JSIgnoredPromiseFromCall
        this.rallyPoint.navigateGameObjectToRallyPoint(newGameObject);
      }
    }
  }

  /**
   * find queue with lest products that is not at capacity
   */
  private findQueueForProduct(): ProductionQueue | undefined {
    let queueWithLeastProducts: ProductionQueue | undefined = undefined;
    let queueWithLeastProductsCount = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;

      // Check if the queue is not at full capacity
      if (queue.queuedItems.length < this.productionDefinition.capacityPerQueue) {
        if (queue.queuedItems.length < queueWithLeastProductsCount) {
          queueWithLeastProducts = queue;
          queueWithLeastProductsCount = queue.queuedItems.length;
        }
      }
    }

    return queueWithLeastProducts;
  }

  private canAssignProduction(item: ProductionQueueItem): AssignProductionErrorCode | null {
    if (!this.isFinished) return AssignProductionErrorCode.NotFinished;
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

  private resetQueue(queue: ProductionQueue) {
    if (queue.queuedItems.length <= 0) return;
    const { costData } = queue.queuedItems[0]!;
    queue.remainingProductionTime = costData.productionTime;
  }

  private destroy() {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.playerChangedSubscription?.unsubscribe();
    this.rallyPoint.destroy();
  }

  cancelProduction(item: ProductionQueueItem) {
    if (!this.isFinished) return;
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;
      const index = queue.queuedItems.findIndex((i) => i.actorName === item.actorName);

      if (index !== -1) {
        // Get the item being cancelled
        const cancelledItem = queue.queuedItems[index]!;
        const { costData } = cancelledItem;

        // Remove the item from the queue
        queue.queuedItems.splice(index, 1);

        // Notify of queue change
        this.queueChangeSubject.next({
          itemsFromAllQueues: this.itemsFromAllQueues,
          type: "remove"
        });

        this.refund(costData, queue);

        // If queue is empty, reset progress
        if (queue.queuedItems.length === 0) {
          this.productionProgressSubject.next({
            queueIndex: i,
            queueItemIndex: 0,
            progressInPercentage: 0
          });
        }

        // If the first item was cancelled, reset the queue
        if (index === 0) {
          this.resetQueue(queue);
        }

        break;
      }
    }
  }

  private refund(costData: ProductionCostDefinition, queue: ProductionQueue) {
    // Refund resources based on payment type and progress
    const owner = this.ownerComponent.getOwner();
    if (!owner) return;
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) return;
    const refundedResources: Partial<Record<ResourceType, number>> = {};
    switch (costData.costType) {
      case PaymentType.PayOverTime: // For pay over time, calculate partial refund based on progress
        const totalProductionTime = costData.productionTime;
        const remainingTime = queue.remainingProductionTime;
        const elapsedTime = totalProductionTime - remainingTime;
        const progressPercentage = elapsedTime / totalProductionTime;

        Object.entries(costData.resources).forEach(([type, amount]) => {
          // Refund based on remaining progress and refund factor
          refundedResources[type as ResourceType] = Math.floor(
            (amount || 0) * (1 - progressPercentage) * costData.refundFactor
          );
        });
        break;
      case PaymentType.PayImmediately: // For immediate payment, use full refund factor
        Object.entries(costData.resources).forEach(([type, amount]) => {
          refundedResources[type as ResourceType] = Math.floor((amount || 0) * costData.refundFactor);
        });
        break;
    }
    emitResource(this.gameObject.scene, "resource.added", refundedResources);
  }

  private canIssueCommand() {
    const currentPlayerNr = getCurrentPlayerNumber(this.gameObject.scene);
    const actorPlayerNr = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  getData(): ProductionComponentData {
    // Flatten all queues into a simple list of product names for save
    const queueNames = this.itemsFromAllQueues.map((i) => i.actorName);
    return {
      queue: queueNames,
      isProducing: this.isProducing,
      progress: this.getCurrentProgress() ?? 0,
      rallyPoint: this.rallyPoint.getRallyData()
    } satisfies ProductionComponentData;
  }

  setData(data: Partial<ProductionComponentData>) {
    if (data.queue) {
      // Clear existing queues
      this.productionQueues.forEach((queue) => {
        queue.queuedItems = [];
        queue.remainingProductionTime = 0;
      });

      // Rebuild queues from names
      data.queue.forEach((actorName) => {
        const def = pwActorDefinitions[actorName];
        const cost = def.components?.productionCost;
        if (!cost) {
          console.warn(`No production cost found for ${actorName}, skipping...`);
          return;
        }
        const dummyItem: ProductionQueueItem = {
          actorName,
          costData: cost
        };
        const queue = this.findQueueForProduct();
        if (queue) {
          queue.queuedItems.push(dummyItem);
        }
      });

      // Reset production timers for all queues
      this.productionQueues.forEach((queue) => {
        this.resetQueue(queue);
      });
    }

    if (data.rallyPoint) this.rallyPoint.setRallyData(data.rallyPoint);
  }
}

export enum AssignProductionErrorCode {
  NotEnoughResources = 1,
  QueueFull = 2,
  InvalidProduct = 3,
  NoOwner = 4,
  NotFinished
}
