import { Subject } from "rxjs";
import type { SharedQueueItem } from "./shared-queue-item";
import { SharedQueueItemType } from "./shared-queue-item-type";
import { ProductionComponent } from "../production/production-component";
import { ResearchComponent } from "../research/research-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { researchDefinitions } from "../research/research-definitions";
import { QueueItemType, type UnifiedQueueItem } from "./queue-item";
import { SharedQueue } from "../production/shared-queue";
import { PaymentType } from "../production/payment-type";
import type { ProductionQueueItem } from "../production/game-object";
import Phaser from "phaser";
import type { QueueDefinition } from "../production/queue-definition";
import { getActorComponent } from "../../../data/actor-component";
import { addActorComponent } from "../../../data/actor-data";
import { getSimulationDelta } from "../../../world/services/simulation-time";

/**
 * SharedQueueComponent is the queue owner and processor.
 * It owns the ProductionQueue[] array, runs the update loop,
 * and delegates completion to ProductionComponent/ResearchComponent.
 */
export class QueueComponent {
  // Queue ownership
  private sharedQueues: SharedQueue[] = [];
  private readonly capacityPerQueue: number = 0;

  // Display queue notification (for UI)
  private queueChangedSubject = new Subject<SharedQueueItem[]>();

  // Component references (set during registration)
  private productionComponent?: ProductionComponent;
  private researchComponent?: ResearchComponent;
  private lastSimulationTimeMs?: number;

  constructor(
    readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly queueDefinition: QueueDefinition
  ) {
    this.capacityPerQueue = queueDefinition.capacityPerQueue;

    // Initialize queues
    for (let i = 0; i < queueDefinition.queueCount; i++) {
      this.sharedQueues.push(new SharedQueue(queueDefinition.capacityPerQueue));
    }

    // Hook to Phaser UPDATE event
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  static createSharedQueue(gameObject: Phaser.GameObjects.GameObject): QueueComponent {
    // Create SharedQueueComponent with queue configuration
    let sharedQueue = getActorComponent(gameObject, QueueComponent);
    const queueDefinition = getPwActorDefinition(gameObject.name, null)?.components?.queue;
    if (!sharedQueue) {
      sharedQueue = new QueueComponent(
        gameObject,
        queueDefinition ??
          ({
            queueCount: 1,
            capacityPerQueue: 5
          } satisfies QueueDefinition)
      );
      addActorComponent(gameObject, sharedQueue);
    }
    return sharedQueue;
  }

  /**
   * Main update loop - processes all queue items
   */
  private update(): void {
    if (!this.gameObject.scene) return;
    const simulationDelta = getSimulationDelta(this.gameObject.scene, this.lastSimulationTimeMs);
    this.lastSimulationTimeMs = simulationDelta.now;
    const deltaWithTimeScale = simulationDelta.delta;

    // Process each queue's first item
    for (let queueIndex = 0; queueIndex < this.sharedQueues.length; queueIndex++) {
      const queue = this.sharedQueues[queueIndex]!;
      if (queue.queuedItems.length === 0) continue;

      const firstItem = queue.queuedItems[0]!;

      // Handle production items
      if (firstItem.type === QueueItemType.Production) {
        this.processProductionItem(queue, queueIndex, deltaWithTimeScale);
      }
      // Handle research items
      else if (firstItem.type === QueueItemType.Research) {
        this.processResearchItem(queue, queueIndex, deltaWithTimeScale);
      }
    }
  }

  /**
   * Process a production item in the queue
   */
  private processProductionItem(queue: SharedQueue, queueIndex: number, delta: number): void {
    const firstItem = queue.queuedItems[0]!;
    if (!firstItem.productionData) return;

    const { costData } = firstItem.productionData;

    // Handle payment
    let paid = true;
    if (costData.costType === PaymentType.PayOverTime) {
      if (!this.productionComponent) return;
      paid = this.productionComponent.handlePayOverTimePayment(costData.resources);
    }

    if (!paid) return;

    // Update progress on the item itself
    firstItem.remainingTime -= delta;
    firstItem.remainingTime = Math.max(firstItem.remainingTime, 0);

    const progress = ((firstItem.totalTime - firstItem.remainingTime) / firstItem.totalTime) * 100;

    // Emit progress event via ProductionComponent
    if (this.productionComponent) {
      this.productionComponent.emitProductionProgress({
        queueIndex: queueIndex,
        queueItemIndex: 0,
        progressInPercentage: Math.min(progress, 100)
      });
    }

    // Check completion
    if (firstItem.remainingTime <= 0) {
      this.completeProductionItem(queue, queueIndex);
    }
  }

  /**
   * Process a research item in the queue
   */
  private processResearchItem(queue: SharedQueue, queueIndex: number, delta: number): void {
    const firstItem = queue.queuedItems[0]!;
    if (!firstItem.researchData) return;

    // Update progress on the item itself
    firstItem.remainingTime -= delta;
    firstItem.remainingTime = Math.max(firstItem.remainingTime, 0);

    const progress = ((firstItem.totalTime - firstItem.remainingTime) / firstItem.totalTime) * 100;

    // Emit progress for research
    if (this.researchComponent) {
      this.researchComponent.researchProgress.emit({
        type: firstItem.researchData,
        progress: Math.min(progress, 100)
      });
      this.gameObject.emit(ResearchComponent.ResearchProgressEvent, {
        type: firstItem.researchData,
        progress: Math.min(progress, 100)
      });
    }

    // Check completion
    if (firstItem.remainingTime <= 0) {
      this.completeResearchItem(queue, queueIndex);
    }
  }

  /**
   * Complete a production item - delegate to ProductionComponent for spawning
   */
  private async completeProductionItem(queue: SharedQueue, queueIndex: number): Promise<void> {
    const item = queue.queuedItems[0]!;
    if (item.type !== QueueItemType.Production || !item.productionData) return;

    // Remove from queue
    queue.queuedItems.splice(0, 1);

    // Delegate to ProductionComponent for spawning logic
    if (this.productionComponent) {
      await this.productionComponent.handleProductionComplete(item.productionData);
    }

    // No need to reset queue - items are self-contained with their own remainingTime

    // Emit queue change
    if (this.productionComponent) {
      this.productionComponent.emitQueueChange({
        itemsFromAllQueues: this.allItems,
        type: "completed"
      });
    }

    this.notifyQueueChanged();
  }

  /**
   * Complete a research item - delegate to ResearchComponent for tech tree registration
   */
  private completeResearchItem(queue: SharedQueue, queueIndex: number): void {
    const item = queue.queuedItems[0]!;
    if (item.type !== QueueItemType.Research || !item.researchData) return;

    // Remove from queue
    queue.queuedItems.splice(0, 1);

    // Delegate to ResearchComponent for tech tree registration
    if (this.researchComponent) {
      this.researchComponent.handleResearchComplete(item.researchData);
    }

    // No need to reset queue - items are self-contained with their own remainingTime

    // Emit queue change
    if (this.productionComponent) {
      this.productionComponent.emitQueueChange({
        itemsFromAllQueues: this.allItems,
        type: "completed"
      });
    }

    this.notifyQueueChanged();
  }

  /**
   * Public API: Add an item to the queue with least remaining time
   */
  addItem(item: UnifiedQueueItem): void {
    const queue = this.findQueueWithLeastTime();
    if (!queue) {
      throw new Error("No queue available");
    }

    // Initialize remainingTime if not set
    if (item.remainingTime === undefined || item.remainingTime === 0) {
      item.remainingTime = item.totalTime;
    }

    queue.queuedItems.push(item);

    // Emit queue change
    if (this.productionComponent) {
      this.productionComponent.emitQueueChange({
        itemsFromAllQueues: this.allItems,
        type: "add"
      });
    }

    this.notifyQueueChanged();
  }

  /**
   * Public API: Cancel a production item
   */
  cancelProductionItem(item: ProductionQueueItem): boolean {
    for (let i = 0; i < this.sharedQueues.length; i++) {
      const queue = this.sharedQueues[i]!;
      const index = queue.queuedItems.findIndex(
        (queueItem) =>
          queueItem.type === QueueItemType.Production && queueItem.productionData?.actorName === item.actorName
      );

      if (index !== -1) {
        const cancelledItem = queue.queuedItems[index]!;
        if (cancelledItem.type !== QueueItemType.Production || !cancelledItem.productionData) {
          continue;
        }

        // Remove from queue
        queue.queuedItems.splice(index, 1);

        // Delegate refund to ProductionComponent
        if (this.productionComponent) {
          this.productionComponent.handleProductionRefund(cancelledItem.productionData.costData, cancelledItem);
          this.productionComponent.emitQueueChange({
            itemsFromAllQueues: this.allItems,
            type: "remove"
          });

          // Reset progress if queue is empty
          if (queue.queuedItems.length === 0) {
            this.productionComponent.emitProductionProgress({
              queueIndex: i,
              queueItemIndex: 0,
              progressInPercentage: 0
            });
          }
        }

        this.notifyQueueChanged();
        return true;
      }
    }
    return false;
  }

  /**
   * Public API: Cancel the first research item
   */
  cancelResearchItem(): boolean {
    for (const queue of this.sharedQueues) {
      const firstItem = queue.queuedItems[0];
      if (firstItem && firstItem.type === QueueItemType.Research && firstItem.researchData) {
        const type = firstItem.researchData;

        // Delegate refund to ResearchComponent
        if (this.researchComponent) {
          this.researchComponent.handleResearchRefund(type, firstItem.remainingTime, firstItem.totalTime);
        }

        // Remove from queue
        queue.queuedItems.splice(0, 1);

        // Emit cancellation
        if (this.researchComponent) {
          this.researchComponent.researchCancelled.emit(type);
          this.gameObject.emit(ResearchComponent.ResearchCancelledEvent, type);
        }

        // Emit queue change
        if (this.productionComponent) {
          this.productionComponent.emitQueueChange({
            itemsFromAllQueues: this.allItems,
            type: "remove"
          });
        }

        this.notifyQueueChanged();
        return true;
      }
    }
    return false;
  }

  /**
   * Find queue with the least remaining time that is not at capacity
   */
  private findQueueWithLeastTime(): SharedQueue | undefined {
    let queueWithLeastTime: SharedQueue | undefined = undefined;
    let leastTime = Number.MAX_SAFE_INTEGER;

    for (const queue of this.sharedQueues) {
      if (queue.queuedItems.length < this.capacityPerQueue) {
        const totalTime = this.getTotalRemainingTimeForQueue(queue);
        if (totalTime < leastTime) {
          queueWithLeastTime = queue;
          leastTime = totalTime;
        }
      }
    }

    return queueWithLeastTime;
  }

  /**
   * Get total remaining time for a queue
   */
  private getTotalRemainingTimeForQueue(queue: SharedQueue): number {
    if (queue.queuedItems.length === 0) return 0;

    let totalTime = 0;

    for (const item of queue.queuedItems) {
      totalTime += item.remainingTime;
    }

    return totalTime;
  }

  /**
   * Public API: Get queue with least remaining time (for validation)
   */
  findQueueForNewItem(): SharedQueue | undefined {
    return this.findQueueWithLeastTime();
  }

  /**
   * Public API: Get total remaining production time across all queues
   */
  getTotalRemainingProductionTime(): number {
    let totalTime = 0;
    for (const queue of this.sharedQueues) {
      totalTime += this.getTotalRemainingTimeForQueue(queue);
    }
    return totalTime;
  }

  /**
   * Public API: Get progress for a specific queue
   */
  getQueueProgress(queue: SharedQueue): number | null {
    if (queue.queuedItems.length === 0) return null;

    const firstItem = queue.queuedItems[0]!;
    const totalTime = firstItem.totalTime;
    const remainingTime = firstItem.remainingTime;

    return ((totalTime - remainingTime) / totalTime) * 100;
  }

  /**
   * Public API: Check if any queue is producing
   */
  get isProducing(): boolean {
    for (const queue of this.sharedQueues) {
      if (queue.queuedItems.length > 0) {
        return true;
      }
    }
    return false;
  }

  /**
   * Public API: Get all items from all queues
   */
  get allItems(): UnifiedQueueItem[] {
    return this.sharedQueues.reduce((acc, queue) => acc.concat(queue.queuedItems), [] as UnifiedQueueItem[]);
  }

  /**
   * Public API: Get the raw queues (for compatibility)
   */
  get queues(): SharedQueue[] {
    return this.sharedQueues;
  }

  /**
   * Register production component (called by ProductionComponent)
   */
  registerProductionComponent(productionComponent: ProductionComponent): void {
    this.productionComponent = productionComponent;
    this.notifyQueueChanged();
  }

  /**
   * Register research component (called by ResearchComponent)
   */
  registerResearchComponent(researchComponent: ResearchComponent): void {
    this.researchComponent = researchComponent;
    this.notifyQueueChanged();
  }

  /**
   * Observable that emits whenever the unified queue changes
   */
  get queueChangedObservable() {
    return this.queueChangedSubject.asObservable();
  }

  /**
   * Get the current unified queue items (for UI display)
   * Computed on-demand from sharedQueues
   */
  get items(): SharedQueueItem[] {
    const items: SharedQueueItem[] = [];
    let displayIndex = 0;

    for (const queue of this.sharedQueues) {
      for (let i = 0; i < queue.queuedItems.length; i++) {
        const item = queue.queuedItems[i]!;

        // Calculate progress (only for first item in queue)
        const progress = i === 0 ? (this.getQueueProgress(queue) ?? 0) : 0;

        // Handle production items
        if (item.type === QueueItemType.Production && item.productionData) {
          const actorDefinition = getPwActorDefinition(item.productionData.actorName, null);
          const infoComponent = actorDefinition?.components?.info;
          if (infoComponent?.smallImage) {
            items.push({
              type: SharedQueueItemType.Production,
              id: `production-${displayIndex}`,
              iconData: {
                key: infoComponent.smallImage.key,
                frame: infoComponent.smallImage.frame,
                origin: infoComponent.smallImage.origin
              },
              progressPercent: progress,
              displayIndex: displayIndex++,
              productionData: item.productionData
            });
          }
        }
        // Handle research items
        else if (item.type === QueueItemType.Research && item.researchData) {
          const researchData = researchDefinitions[item.researchData];
          if (researchData && researchData.icon) {
            items.push({
              type: SharedQueueItemType.Research,
              id: `research-${item.researchData}`,
              iconData: {
                key: researchData.icon.key,
                frame: researchData.icon.frame,
                origin: { x: 0.5, y: 0.5 }
              },
              progressPercent: progress,
              displayIndex: displayIndex++,
              researchData: item.researchData
            });
          }
        }
      }
    }

    return items;
  }

  /**
   * Get the total number of items in the queue
   */
  get length(): number {
    return this.allItems.length;
  }

  /**
   * Get item at specific display index
   */
  getItemAt(index: number): SharedQueueItem | undefined {
    return this.items[index];
  }

  /**
   * Notify subscribers that the queue has changed
   */
  private notifyQueueChanged(): void {
    this.queueChangedSubject.next(this.items);
  }

  /**
   * Get serialized data for save/load
   */
  getData(): UnifiedQueueItem[] {
    return this.allItems;
  }

  /**
   * Set data from save/load
   */
  setData(items: UnifiedQueueItem[]): void {
    // Clear existing queues
    this.sharedQueues.forEach((queue) => {
      queue.queuedItems = [];
    });

    // Rebuild queues from saved items (items already have their remainingTime set)
    items.forEach((item) => {
      const queue = this.findQueueWithLeastTime();
      if (queue) {
        queue.queuedItems.push(item);
      }
    });

    this.notifyQueueChanged();
  }

  /**
   * Cleanup
   */
  private destroy(): void {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.productionComponent = undefined;
    this.researchComponent = undefined;
    this.queueChangedSubject.next([]);
  }
}
