import { PaymentType } from "./payment-type";
import { ProductionQueue } from "./production-queue";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { addActorComponent } from "../../../data/actor-data";
import { emitResource, getCommunicator, getCurrentPlayerNumber, getPlayer } from "../../../data/scene-data";
import { SharedQueueComponent } from "../queue/shared-queue-component";
import { QueueItemType, type UnifiedQueueItem } from "../queue/queue-item";
import { ResearchComponent } from "../research/research-component";
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

    // Create or get SharedQueueComponent and register this production component
    let sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) {
      sharedQueue = new SharedQueueComponent(this.gameObject);
      addActorComponent(this.gameObject, sharedQueue);
    }
    sharedQueue.registerProductionComponent(this);
  }

  get productionProgressObservable() {
    return this.productionProgressSubject.asObservable();
  }

  get queueChangeObservable() {
    return this.queueChangeSubject.asObservable();
  }

  get itemsFromAllQueues() {
    return this.productionQueues.reduce((acc, queue) => acc.concat(queue.queuedItems), [] as UnifiedQueueItem[]);
  }

  get isFinished() {
    return getActorComponent(this.gameObject, ConstructionSiteComponent)?.isFinished ?? true;
  }

  update(_: number, delta: number): void {
    const deltaWithTimeScale = delta * this.gameObject.scene.time.timeScale;

    if (!this.isFinished) return;

    // Process first item in each queue
    for (let queueIndex = 0; queueIndex < this.productionQueues.length; queueIndex++) {
      const queue = this.productionQueues[queueIndex]!;
      if (queue.queuedItems.length === 0) continue;

      const firstItem = queue.queuedItems[0]!;

      // Handle production items
      if (firstItem.type === QueueItemType.Production) {
        if (!firstItem.productionData) {
          throw new Error("Production item missing productionData");
        }

        const { costData } = firstItem.productionData;

        let productionCostPaid = false;
        if (costData.costType === PaymentType.PayOverTime) {
          productionCostPaid = this.handlePayOverTimePayment(costData.resources);
        } else {
          productionCostPaid = true;
        }

        if (!productionCostPaid) {
          continue;
        }

        // Update production progress
        queue.remainingProductionTime -= deltaWithTimeScale;
        queue.remainingProductionTime = Math.max(queue.remainingProductionTime, 0);

        const progress = ((costData.productionTime - queue.remainingProductionTime) / costData.productionTime) * 100;

        // Emit progress event
        this.productionProgressSubject.next({
          queueIndex: queueIndex,
          queueItemIndex: 0, // Always processing first item
          progressInPercentage: Math.min(progress, 100)
        });

        // Check if production is complete
        if (queue.remainingProductionTime <= 0) {
          this.finishProduction(queue, 0);
        }
      }
      // Handle research items
      else if (firstItem.type === QueueItemType.Research) {
        if (!firstItem.researchData) {
          throw new Error("Research item missing researchData");
        }

        // Update research progress
        queue.remainingProductionTime -= deltaWithTimeScale;
        queue.remainingProductionTime = Math.max(queue.remainingProductionTime, 0);

        const progress = ((firstItem.totalTime - queue.remainingProductionTime) / firstItem.totalTime) * 100;

        // Emit progress for research
        const researchComponent = getActorComponent(this.gameObject, ResearchComponent);
        if (researchComponent) {
          researchComponent.researchProgress.emit({
            type: firstItem.researchData,
            progress: Math.min(progress, 100)
          });
          this.gameObject.emit(ResearchComponent.ResearchProgressEvent, {
            type: firstItem.researchData,
            progress: Math.min(progress, 100)
          });
        }

        // Check if research is complete
        if (queue.remainingProductionTime <= 0) {
          this.finishResearch(queue, 0);
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
      const progress = this.getQueueProgress(queue);
      if (progress !== null) {
        return progress;
      }
    }
    return null;
  }

  /**
   * Get the progress percentage for a specific queue's first item
   */
  getQueueProgress(queue: ProductionQueue): number | null {
    if (queue.queuedItems.length === 0) return null;

    const firstItem = queue.queuedItems[0]!;
    const totalTime = firstItem.totalTime;
    const remainingTime = queue.remainingProductionTime;

    return ((totalTime - remainingTime) / totalTime) * 100;
  }

  /**
   * Get the total remaining production time across all queues.
   * This is the sum of remaining time for the current item in each queue,
   * plus the full production time of all queued items.
   */
  getTotalRemainingProductionTime(): number {
    let totalTime = 0;

    for (const queue of this.productionQueues) {
      totalTime += this.getTotalRemainingTimeForQueue(queue);
    }

    return totalTime;
  }

  /**
   * Get the total remaining time for a specific queue.
   * This includes remaining time for the current item plus full time for all queued items.
   */
  private getTotalRemainingTimeForQueue(queue: ProductionQueue): number {
    if (queue.queuedItems.length === 0) return 0;

    let totalTime = 0;

    // Add remaining time for the current (first) item in the queue
    totalTime += queue.remainingProductionTime;

    // Add full time for all other items in the queue
    for (let i = 1; i < queue.queuedItems.length; i++) {
      const item = queue.queuedItems[i]!;
      totalTime += item.totalTime; // Use unified totalTime property
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

    // Wrap production item in UnifiedQueueItem and add to queue
    const unifiedItem: UnifiedQueueItem = {
      type: QueueItemType.Production,
      productionData: queueItem,
      totalTime: queueItem.costData.productionTime
    };
    queue.queuedItems.push(unifiedItem);
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

  /**
   * Add an item (production or research) to the queue with least remaining time.
   * Used by ResearchComponent to add research items to production queues.
   */
  addToQueue(item: UnifiedQueueItem): void {
    const queue = this.findQueueForProduct();
    if (!queue) {
      throw new Error("No queue available");
    }

    queue.queuedItems.push(item);

    if (queue.queuedItems.length === 1) {
      this.resetQueue(queue);
    }

    this.queueChangeSubject.next({
      itemsFromAllQueues: this.itemsFromAllQueues,
      type: "add"
    });
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
    const item = queue.queuedItems[queueIndex]!;
    if (item.type !== QueueItemType.Production || !item.productionData) {
      throw new Error("Invalid production item");
    }
    const { actorName } = item.productionData;

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

  private finishResearch(queue: ProductionQueue, queueIndex: number): void {
    if (queueIndex >= queue.queuedItems.length) {
      throw new Error("Invalid queue index");
    }
    const item = queue.queuedItems[queueIndex]!;
    if (item.type !== QueueItemType.Research || !item.researchData) {
      throw new Error("Invalid research item");
    }

    // Remove from queue
    queue.queuedItems.splice(queueIndex, 1);

    // Notify research component
    const researchComponent = getActorComponent(this.gameObject, ResearchComponent);
    if (researchComponent) {
      researchComponent.handleResearchComplete(item.researchData);
    }

    // Reset queue for next item
    if (queue.queuedItems.length > 0) {
      this.resetQueue(queue);
    }

    this.queueChangeSubject.next({
      itemsFromAllQueues: this.itemsFromAllQueues,
      type: "completed"
    });
  }

  /**
   * Find queue with least remaining time that is not at capacity
   */
  private findQueueForProduct(): ProductionQueue | undefined {
    let queueWithLeastTime: ProductionQueue | undefined = undefined;
    let leastTime = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;

      // Check if the queue is not at full capacity
      if (queue.queuedItems.length < this.productionDefinition.capacityPerQueue) {
        const totalTime = this.getTotalRemainingTimeForQueue(queue);
        if (totalTime < leastTime) {
          queueWithLeastTime = queue;
          leastTime = totalTime;
        }
      }
    }

    return queueWithLeastTime;
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

  resetQueue(queue: ProductionQueue): void {
    if (queue.queuedItems.length <= 0) return;
    const firstItem = queue.queuedItems[0]!;
    queue.remainingProductionTime = firstItem.totalTime;
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
      const index = queue.queuedItems.findIndex(
        (queueItem) => queueItem.type === QueueItemType.Production &&
                       queueItem.productionData?.actorName === item.actorName
      );

      if (index !== -1) {
        // Get the item being cancelled
        const cancelledItem = queue.queuedItems[index]!;
        if (cancelledItem.type !== QueueItemType.Production || !cancelledItem.productionData) {
          continue;
        }
        const { costData } = cancelledItem.productionData;

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
    // Flatten all queues into a simple list of product names for save (production items only)
    const queueNames = this.itemsFromAllQueues
      .filter(i => i.type === QueueItemType.Production && i.productionData)
      .map((i) => i.productionData!.actorName);
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
        const productionItem: ProductionQueueItem = {
          actorName,
          costData: cost
        };
        // Wrap in UnifiedQueueItem
        const unifiedItem: UnifiedQueueItem = {
          type: QueueItemType.Production,
          productionData: productionItem,
          totalTime: cost.productionTime
        };
        const queue = this.findQueueForProduct();
        if (queue) {
          queue.queuedItems.push(unifiedItem);
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
