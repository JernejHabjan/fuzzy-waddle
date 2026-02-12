import { PaymentType } from "./payment-type";
import { ProductionQueue } from "./production-queue";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getCommunicator, getCurrentPlayerNumber, getPlayer } from "../../../data/scene-data";
import {
  type ActorDefinition,
  ConstructionStateEnum,
  type ProductionComponentData,
  ResourceType,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SceneActorCreator } from "../../../world/services/scene-actor-creator";
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
import type { ProductionProgressEvent, ProductionQueueChangeEvent } from "./production-events";
import type { ProductionQueueItem } from "./game-object";
import type { ProductionDefinition } from "./production-definition";
import { AssignProductionErrorCode } from "./assign-production-error-code";
import type { ProductionCostDefinition } from "./production-cost-definition";
import { NavigationService } from "../../../world/services/navigation.service";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import GameObject = Phaser.GameObjects.GameObject;

export class ProductionComponent {
  productionQueues: ProductionQueue[] = [];
  private readonly rallyPoint: RallyPoint;
  private ownerComponent?: OwnerComponent;
  private navigationService!: NavigationService;
  private playerChangedSubscription?: Subscription;
  private productionProgressSubject = new Subject<ProductionProgressEvent>();
  private queueChangeSubject = new Subject<ProductionQueueChangeEvent>();
  constructor(
    private readonly gameObject: GameObject,
    public readonly productionDefinition: ProductionDefinition
  ) {
    this.rallyPoint = new RallyPoint(this.gameObject.scene);
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
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.navigationService = getSceneService(this.gameObject.scene, NavigationService)!;
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

  update(_: number, delta: number): void {
    const deltaWithTimeScale = delta * this.gameObject.scene.time.timeScale;

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
        queue.remainingProductionTime -= deltaWithTimeScale;
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

  /**
   * Get the total remaining production time across all queues.
   * This is the sum of remaining time for the current item in each queue,
   * plus the full production time of all queued items.
   */
  getTotalRemainingProductionTime(): number {
    let totalTime = 0;

    for (const queue of this.productionQueues) {
      if (queue.queuedItems.length === 0) continue;

      // Add remaining time for the current (first) item in the queue
      totalTime += queue.remainingProductionTime;

      // Add full production time for all other items in the queue
      for (let i = 1; i < queue.queuedItems.length; i++) {
        const { costData } = queue.queuedItems[i]!;
        totalTime += costData.productionTime;
      }
    }

    return totalTime;
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
      const owner = this.ownerComponent?.getOwner();
      if (!owner) return;

      const player = getPlayer(this.gameObject.scene, owner);
      if (!player) return;

      // Fully pay for the production item
      emitResource(this.gameObject.scene, "resource.removed", queueItem.costData.resources, owner);
    }
  }

  private handlePayOverTimePayment(resources: Partial<Record<ResourceType, number>>): boolean {
    const owner = this.ownerComponent?.getOwner();
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
      emitResource(this.gameObject.scene, "resource.removed", resources, owner);
      productionCostPaid = true;
    }

    return productionCostPaid;
  }

  private async finishProduction(queue: ProductionQueue, queueIndex: number) {
    if (queueIndex >= queue.queuedItems.length) {
      throw new Error("Invalid queue index");
    }
    const { actorName } = queue.queuedItems[queueIndex]!;

    const logicalTransform = getGameObjectLogicalTransform(this.gameObject);
    if (!logicalTransform) throw new Error("Transform not found");

    // offset spawn position
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) throw new Error("Bounds not found");
    const { width, height } = bounds;

    // Get NavigationService to find a valid spawn location
    let finalSpawnPosition = {
      x: logicalTransform.x + width / 2,
      y: logicalTransform.y + height / 4,
      z: logicalTransform.z
    } satisfies Vector3Simple;
    let validSpawnLocationFound = false;

    // Determine target tile preference based on rally point if it's set
    let targetTile: Vector3Simple | undefined;
    if (this.rallyPoint.isSet()) {
      targetTile = this.rallyPoint.tileVec3;
    }

    const unoccupiedTile = this.navigationService.getSpawnPointAroundGameObject(this.gameObject, undefined, targetTile);
    if (unoccupiedTile) {
      const unoccupiedWorldPosition = IsoHelper.isometricTileToWorldXY(
        this.gameObject.scene,
        unoccupiedTile.x,
        unoccupiedTile.y
      )!;
      finalSpawnPosition = {
        x: unoccupiedWorldPosition.x,
        y: unoccupiedWorldPosition.y,
        z: finalSpawnPosition.z
      } satisfies Vector3Simple;
      validSpawnLocationFound = true;
    }

    // If no valid spawn location found, keep item in queue as nearly finished but don't spawn
    if (!validSpawnLocationFound) {
      // do not spawn
      return;
    }

    queue.queuedItems.splice(queueIndex, 1);
    this.resetQueue(queue);
    this.queueChangeSubject.next({
      itemsFromAllQueues: this.itemsFromAllQueues,
      type: "completed"
    });

    // Spawn gameObject using helper
    const originalOwner = this.ownerComponent?.getOwner();

    const sceneActorCreator = getSceneService(this.gameObject.scene, SceneActorCreator);
    if (!sceneActorCreator) throw new Error("SceneActorCreator not found");

    const newGameObject = sceneActorCreator.createFinishedActor(actorName, finalSpawnPosition, originalOwner);
    if (newGameObject) {
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

    const owner = this.ownerComponent?.getOwner();
    if (!owner) return AssignProductionErrorCode.NoOwner;

    // check if player has enough resources
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) return AssignProductionErrorCode.NoOwner;

    if (item.costData.costType === PaymentType.PayImmediately) {
      const canPayAllResources = player.canPayAllResources(item.costData.resources);
      if (!canPayAllResources) return AssignProductionErrorCode.NotEnoughResources;
    }

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
    const owner = this.ownerComponent?.getOwner();
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
    emitResource(this.gameObject.scene, "resource.added", refundedResources, owner);
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
