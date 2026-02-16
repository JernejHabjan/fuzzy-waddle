import { PaymentType } from "./payment-type";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getCommunicator, getCurrentPlayerNumber, getPlayer } from "../../../data/scene-data";
import { QueueComponent } from "../queue/queue-component";
import { QueueItemType, type UnifiedQueueItem } from "../queue/queue-item";
import { type ProductionComponentData, ResourceType, type Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SceneActorCreator } from "../../../world/services/scene-actor-creator";
import { getGameObjectBounds, getGameObjectLogicalTransform, onObjectReady } from "../../../data/game-object-helper";
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
    this.listenToMoveEvents();
    onObjectReady(gameObject, this.initOnObjectReady, this);
    gameObject.on(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  initOnObjectReady() {
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.navigationService = getSceneService(this.gameObject.scene, NavigationService)!;
    this.rallyPoint.init(this.gameObject);
    this.createSharedQueue();
  }

  private createSharedQueue() {
    const queue = QueueComponent.createSharedQueue(this.gameObject);
    queue.registerProductionComponent(this);
  }

  get productionProgressObservable() {
    return this.productionProgressSubject.asObservable();
  }

  get queueChangeObservable() {
    return this.queueChangeSubject.asObservable();
  }

  get isFinished() {
    return getActorComponent(this.gameObject, ConstructionSiteComponent)?.isFinished ?? true;
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
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    return sharedQueue?.isProducing ?? false;
  }

  get isIdle() {
    return !this.isProducing;
  }

  get itemsFromAllQueues() {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    return sharedQueue?.allItems ?? [];
  }

  getTotalRemainingProductionTime(): number {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    return sharedQueue?.getTotalRemainingProductionTime() ?? 0;
  }

  getCurrentProgress() {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue || !sharedQueue.isProducing) return null;

    for (const queue of sharedQueue.queues) {
      const progress = sharedQueue.getQueueProgress(queue);
      if (progress !== null) {
        return progress;
      }
    }
    return null;
  }

  /**
   * Start production - delegates to SharedQueueComponent
   */
  startProduction(queueItem: ProductionQueueItem): AssignProductionErrorCode | null {
    if (!this.isFinished) return AssignProductionErrorCode.NotFinished;

    const productionState = this.canAssignProduction(queueItem);
    if (productionState) {
      return productionState;
    }

    this.handleImmediatePayment(queueItem);

    // Delegate to SharedQueueComponent
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) {
      throw new Error("SharedQueueComponent not found");
    }

    const unifiedItem: UnifiedQueueItem = {
      type: QueueItemType.Production,
      productionData: queueItem,
      totalTime: queueItem.costData.productionTime,
      remainingTime: queueItem.costData.productionTime
    };

    sharedQueue.addItem(unifiedItem);
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

  /**
   * Public method for SharedQueueComponent to call during PayOverTime processing
   */
  public handlePayOverTimePayment(resources: Partial<Record<ResourceType, number>>): boolean {
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

  /**
   * Called by SharedQueueComponent when production completes.
   * Handles spawning logic only - queue manipulation is handled by SharedQueue.
   */
  async handleProductionComplete(item: ProductionQueueItem): Promise<void> {
    const { actorName } = item;

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

    // If no valid spawn location found, don't spawn (item stays completed in queue logic)
    if (!validSpawnLocationFound) {
      return;
    }

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
   * Public method for SharedQueueComponent to emit production progress
   */
  public emitProductionProgress(event: ProductionProgressEvent): void {
    this.productionProgressSubject.next(event);
  }

  /**
   * Public method for SharedQueueComponent to emit queue changes
   */
  public emitQueueChange(event: ProductionQueueChangeEvent): void {
    this.queueChangeSubject.next(event);
  }

  /**
   * Public method for SharedQueueComponent to handle production refunds
   */
  public handleProductionRefund(costData: ProductionCostDefinition, item: UnifiedQueueItem): void {
    const owner = this.ownerComponent?.getOwner();
    if (!owner) return;
    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) return;

    const refundedResources: Partial<Record<ResourceType, number>> = {};
    switch (costData.costType) {
      case PaymentType.PayOverTime: // For pay over time, calculate partial refund based on progress
        const totalProductionTime = costData.productionTime;
        const remainingTime = item.remainingTime;
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

  private canAssignProduction(item: ProductionQueueItem): AssignProductionErrorCode | null {
    if (!this.isFinished) return AssignProductionErrorCode.NotFinished;
    // check if gameObject can be produced
    if (!this.productionDefinition.availableProduceActors.includes(item.actorName))
      return AssignProductionErrorCode.InvalidProduct;

    // check if queue is not full
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) return AssignProductionErrorCode.QueueFull;

    const queue = sharedQueue.findQueueForNewItem();
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

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
    this.rallyPoint.destroy();
  }

  /**
   * Cancel production - delegates to SharedQueueComponent
   */
  cancelProduction(item: ProductionQueueItem) {
    if (!this.isFinished) return;

    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) return;

    sharedQueue.cancelProductionItem(item);
  }

  private canIssueCommand() {
    const currentPlayerNr = getCurrentPlayerNumber(this.gameObject.scene);
    const actorPlayerNr = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  getData(): ProductionComponentData {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);

    // Get all production items with their remaining times
    const queueItems = (sharedQueue?.allItems ?? [])
      .filter((i) => i.type === QueueItemType.Production && i.productionData)
      .map((i) => ({
        name: i.productionData!.actorName,
        remainingTime: i.remainingTime
      }));

    return {
      queue: queueItems,
      isProducing: this.isProducing,
      rallyPoint: this.rallyPoint.getRallyData()
    } satisfies ProductionComponentData;
  }

  setData(data: Partial<ProductionComponentData>) {
    if (data.queue && data.queue.length > 0) {
      this.createSharedQueue();
      const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
      if (!sharedQueue) return;

      const items: UnifiedQueueItem[] = [];

      // Build unified queue items from saved data with per-item progress
      data.queue.forEach((queueItem) => {
        // Handle both new format (ProductionQueueItemData) and legacy format (string)
        const actorName = queueItem.name;
        const savedRemainingTime = queueItem.remainingTime;

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
        const unifiedItem: UnifiedQueueItem = {
          type: QueueItemType.Production,
          productionData: productionItem,
          totalTime: cost.productionTime,
          remainingTime: savedRemainingTime ?? cost.productionTime // Use saved time or default to full
        };
        items.push(unifiedItem);
      });

      // Delegate to SharedQueue
      sharedQueue.setData(items);
    }

    if (data.rallyPoint) this.rallyPoint.setRallyData(data.rallyPoint);
  }
}
