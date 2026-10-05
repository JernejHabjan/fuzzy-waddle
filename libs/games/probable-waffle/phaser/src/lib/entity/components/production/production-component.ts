import { emitQueueItemResource, recordQueueItemPaymentDenied } from "../../../data/emit-queue-item-resource";
import Phaser from "phaser";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer } from "../../../data/scene-data";
import { QueueComponent } from "../queue/queue-component";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import {
  type GameCommandExecution,
  type CancelProductionCommand,
  ProbableWaffleGameCommandTypes,
  type ProductionComponentData,
  ResourceType
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { HealthComponent } from "../combat/components/health-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { onObjectReady } from "../../../data/game-object-helper";
import { Subject, Subscription } from "rxjs";
import RallyPoint from "../../../prefabs/buildings/misc/RallyPoint";
import { ConstructionSiteComponent } from "../construction/construction-site-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import type {
  ProductionProgressEvent,
  ProductionQueueChangeEvent
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-events";
import type { ProductionQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/game-object";
import type { ProductionDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-definition";
import {
  AssignProductionErrorCode
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/assign-production-error-code";
import type {
  ProductionCostDefinition
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import { NavigationService } from "../../../world/services/navigation.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OrderType } from "../../../ai/order-type";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import type { ProductionGameObject as GameObject } from "./production-game-object";
import { spawnProductionActor } from "./production-spawner";

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
    gameObject.on(OwnerComponent.OwnerChangedEvent, this.handleOwnerChanged, this);
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

  /**
   * Derives production-building rally points from the deterministic command stream, not
   * local UI interaction. Every peer therefore observes the same move/actor target,
   * while ownership and actor-ID checks prevent another player’s command from changing
   * this building’s spawn destination.
   */
  private listenToMoveEvents() {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
    if (!commandBus) {
      return;
    }

    this.playerChangedSubscription = commandBus.command$.subscribe((command) => {
      const owner = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
      if (owner === undefined || owner !== command.playerNumber) {
        return;
      }

      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (!actorId || !command.actorIds.includes(actorId)) {
        return;
      }

      if (command.type === ProbableWaffleGameCommandTypes.SetRallyPoint) {
        if (command.targetObjectId) {
          const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
          const targetActor = actorIndex?.getActorById(command.targetObjectId);
          if (!targetActor?.active) {
            commandBus.reportOutcome(command, "rejected", "invalid_target", [actorId]);
            return;
          }
          this.rallyPoint.setActor(
            targetActor as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform
          );
        } else {
          this.rallyPoint.setLocation(command.tileVec3, command.worldVec3);
        }
        commandBus.reportOutcome(command, "completed", "applied", [actorId], ["rally-point"]);
        return;
      }

      if (command.type === ProbableWaffleGameCommandTypes.Move) {
        // Rally-point assignment is a deterministic MOVE command targeting production buildings.
        // Apply it on every client from the command bus stream, not local UI events.
        this.rallyPoint.setLocation(command.tileVec3, command.worldVec3);
        commandBus.reportOutcome(command, "completed", "applied", [actorId], ["rally-point"]);
        return;
      }

      if (command.type !== ProbableWaffleGameCommandTypes.ActorAction) {
        return;
      }

      if (command.orderType !== undefined && command.orderType !== OrderType.Move) {
        return;
      }

      const targetActorId = command.targetObjectIds?.[0];
      if (!targetActorId) {
        this.rallyPoint.reset();
        return;
      }

      const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
      const targetActor = actorIndex?.getActorById(targetActorId);
      if (!targetActor) {
        this.rallyPoint.reset();
        return;
      }

      this.rallyPoint.setActor(targetActor as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform);
    });
  }

  private handleOwnerChanged() {
    this.rallyPoint.reset();
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
  startProduction(
    queueItem: ProductionQueueItem,
    commandContext?: { execution: GameCommandExecution; playerNumber: PlayerNumber; actorIds: readonly ActorId[] }
  ): AssignProductionErrorCode | null {
    if (!this.isFinished) return AssignProductionErrorCode.NotFinished;

    const productionState = this.canAssignProduction(queueItem);
    if (productionState) {
      return productionState;
    }

    const unifiedItem: UnifiedQueueItem = {
      type: QueueItemType.Production,
      productionData: queueItem,
      totalTime: queueItem.costData.productionTime,
      remainingTime: queueItem.costData.productionTime,
      commandContext
    };

    this.handleImmediatePayment(queueItem, unifiedItem);

    // Delegate to SharedQueueComponent
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) {
      throw new Error("SharedQueueComponent not found");
    }

    sharedQueue.addItem(unifiedItem);
    return null;
  }

  private handleImmediatePayment(queueItem: ProductionQueueItem, item: UnifiedQueueItem): void {
    if (queueItem.costData.costType === PaymentType.PayImmediately) {
      const owner = this.ownerComponent?.getOwner();
      if (!owner) return;

      const player = getPlayer(this.gameObject.scene, owner);
      if (!player) return;

      // Fully pay for the production item
      emitQueueItemResource({ producer: this.gameObject, item, playerNumber: owner,
        operation: "immediate_charge", amounts: queueItem.costData.resources });
    }
  }

  /**
   * Charge the full stored vector for one successful queue tick. The physical item is observed before progress.
   * An unaffordable tick emits only a denial diagnostic and returns false, leaving queue progress unchanged.
   */
  public handlePayOverTimePayment(resources: Partial<Record<ResourceType, number>>, item: UnifiedQueueItem): boolean {
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
      emitQueueItemResource({ producer: this.gameObject, item, playerNumber: owner,
        operation: "tick_charge", amounts: resources });
      productionCostPaid = true;
    } else {
      recordQueueItemPaymentDenied({ producer: this.gameObject, item, playerNumber: owner,
        operation: "tick_charge", amounts: resources });
    }

    return productionCostPaid;
  }

  /**
   * Called by SharedQueueComponent when production completes.
   * Handles spawning logic only - queue manipulation is handled by SharedQueue.
   * The optional removed handle scopes local creation diagnostics; other callers retain their existing behavior.
   */
  async handleProductionComplete(item: ProductionQueueItem, queueItem?: UnifiedQueueItem): Promise<string | null> {
    return spawnProductionActor(
      this.gameObject, item, this.rallyPoint, this.navigationService, this.ownerComponent, queueItem
    );
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
   * Refund the actual removed item using its stored policy. Cancellation lineage is separate from purchase context.
   */
  public handleProductionRefund(
    costData: ProductionCostDefinition, item: UnifiedQueueItem, cancellationCommand?: CancelProductionCommand
  ): void {
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
    emitQueueItemResource({ producer: this.gameObject, item, playerNumber: owner,
      operation: "cancellation_refund", amounts: refundedResources, cancellationCommand });
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
    if (!getSceneService(this.gameObject.scene, TechTreeService)?.isContentAllowed(owner, "actor", item.actorName)) {
      return AssignProductionErrorCode.InvalidProduct;
    }

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
    this.gameObject.off(OwnerComponent.OwnerChangedEvent, this.handleOwnerChanged, this);
    this.rallyPoint.destroy();
  }

  /**
   * Cancel production - delegates to SharedQueueComponent
   */
  cancelProduction(item: ProductionQueueItem, cancellationCommand?: CancelProductionCommand) {
    if (!this.isFinished) return;

    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) return;

    sharedQueue.cancelProductionItem(item, cancellationCommand);
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
    // Fixes stale local queue state when snapshot intentionally contains an empty queue.
    if (data.queue !== undefined) {
      this.createSharedQueue();
      const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
      if (!sharedQueue) return;

      const items: UnifiedQueueItem[] = [];

      // Build unified queue items from saved data with per-item progress
      data.queue.forEach((queueItem) => {
        // Handle both new format (ProductionQueueItemData) and legacy format (string)
        const actorName = queueItem.name;
        const savedRemainingTime = queueItem.remainingTime;

        const def = getPwActorDefinition(actorName, null);
        const cost = def?.components?.productionCost;
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
