import { Subject } from "rxjs";
import type { SharedQueueItem } from "./shared-queue-item";
import { SharedQueueItemType } from "./shared-queue-item-type";
import { ProductionComponent } from "../production/production-component";
import { ResearchComponent } from "../research/research-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { researchDefinitions } from "../research/research-definitions";
import { QueueItemType, type UnifiedQueueItem } from "./queue-item";
import { ProductionQueue } from "../production/production-queue";
import { PaymentType } from "../production/payment-type";
import type { ProductionQueueItem } from "../production/game-object";
import Phaser from "phaser";

/**
 * SharedQueueComponent is the queue owner and processor.
 * It owns the ProductionQueue[] array, runs the update loop,
 * and delegates completion to ProductionComponent/ResearchComponent.
 */
export class SharedQueueComponent {
  // Queue ownership
  private productionQueues: ProductionQueue[] = [];
  private queueCount: number = 0;
  private capacityPerQueue: number = 0;

  // Display queue (for UI)
  private queueChangedSubject = new Subject<SharedQueueItem[]>();
  private unifiedQueue: SharedQueueItem[] = [];

  // Component references (set during registration)
  private productionComponent?: ProductionComponent;
  private researchComponent?: ResearchComponent;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    queueCount: number,
    capacityPerQueue: number
  ) {
    this.queueCount = queueCount;
    this.capacityPerQueue = capacityPerQueue;

    // Initialize queues
    for (let i = 0; i < queueCount; i++) {
      this.productionQueues.push(new ProductionQueue(capacityPerQueue));
    }

    // Hook to Phaser UPDATE event
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  /**
   * Main update loop - processes all queue items
   */
  private update(_time: number, delta: number): void {
    const deltaWithTimeScale = delta * this.gameObject.scene.time.timeScale;

    // Process each queue's first item
    for (let queueIndex = 0; queueIndex < this.productionQueues.length; queueIndex++) {
      const queue = this.productionQueues[queueIndex]!;
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
  private processProductionItem(queue: ProductionQueue, queueIndex: number, delta: number): void {
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
  private processResearchItem(queue: ProductionQueue, queueIndex: number, delta: number): void {
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
  private async completeProductionItem(queue: ProductionQueue, queueIndex: number): Promise<void> {
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

    this.rebuildQueue();
  }

  /**
   * Complete a research item - delegate to ResearchComponent for tech tree registration
   */
  private completeResearchItem(queue: ProductionQueue, queueIndex: number): void {
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

    this.rebuildQueue();
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

    this.rebuildQueue();
  }

  /**
   * Public API: Cancel a production item
   */
  cancelProductionItem(item: ProductionQueueItem): boolean {
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i]!;
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

        this.rebuildQueue();
        return true;
      }
    }
    return false;
  }

  /**
   * Public API: Cancel the first research item
   */
  cancelResearchItem(): boolean {
    for (const queue of this.productionQueues) {
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

        this.rebuildQueue();
        return true;
      }
    }
    return false;
  }

  /**
   * Find queue with least remaining time that is not at capacity
   */
  private findQueueWithLeastTime(): ProductionQueue | undefined {
    let queueWithLeastTime: ProductionQueue | undefined = undefined;
    let leastTime = Number.MAX_SAFE_INTEGER;

    for (const queue of this.productionQueues) {
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
  private getTotalRemainingTimeForQueue(queue: ProductionQueue): number {
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
  findQueueForNewItem(): ProductionQueue | undefined {
    return this.findQueueWithLeastTime();
  }

  /**
   * Public API: Get total remaining production time across all queues
   */
  getTotalRemainingProductionTime(): number {
    let totalTime = 0;
    for (const queue of this.productionQueues) {
      totalTime += this.getTotalRemainingTimeForQueue(queue);
    }
    return totalTime;
  }

  /**
   * Public API: Get progress for a specific queue
   */
  getQueueProgress(queue: ProductionQueue): number | null {
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
    for (const queue of this.productionQueues) {
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
    return this.productionQueues.reduce((acc, queue) => acc.concat(queue.queuedItems), [] as UnifiedQueueItem[]);
  }

  /**
   * Public API: Get the raw queues (for compatibility)
   */
  get queues(): ProductionQueue[] {
    return this.productionQueues;
  }

  /**
   * Register production component (called by ProductionComponent)
   */
  registerProductionComponent(productionComponent: ProductionComponent): void {
    this.productionComponent = productionComponent;
    this.rebuildQueue();
  }

  /**
   * Register research component (called by ResearchComponent)
   */
  registerResearchComponent(researchComponent: ResearchComponent): void {
    this.researchComponent = researchComponent;
    this.rebuildQueue();
  }

  /**
   * Observable that emits whenever the unified queue changes
   */
  get queueChangedObservable() {
    return this.queueChangedSubject.asObservable();
  }

  /**
   * Get the current unified queue items (for UI display)
   */
  get items(): SharedQueueItem[] {
    return [...this.unifiedQueue];
  }

  /**
   * Get the total number of items in the queue
   */
  get length(): number {
    return this.unifiedQueue.length;
  }

  /**
   * Get item at specific display index
   */
  getItemAt(index: number): SharedQueueItem | undefined {
    return this.unifiedQueue[index];
  }

  /**
   * Rebuild the unified queue for UI display
   */
  private rebuildQueue(): void {
    const newQueue: SharedQueueItem[] = [];
    let displayIndex = 0;

    // Iterate through all production queues and collect items
    for (const queue of this.productionQueues) {
      for (let i = 0; i < queue.queuedItems.length; i++) {
        const item = queue.queuedItems[i]!;

        // Calculate progress (only for first item in queue)
        const progress = i === 0 ? (this.getQueueProgress(queue) ?? 0) : 0;

        // Handle production items
        if (item.type === QueueItemType.Production && item.productionData) {
          const actorDefinition = pwActorDefinitions[item.productionData.actorName];
          const infoComponent = actorDefinition.components?.info;
          if (infoComponent?.smallImage) {
            newQueue.push({
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
            newQueue.push({
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

    this.unifiedQueue = newQueue;
    this.queueChangedSubject.next(this.unifiedQueue);
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
    this.productionQueues.forEach((queue) => {
      queue.queuedItems = [];
    });

    // Rebuild queues from saved items (items already have their remainingTime set)
    items.forEach((item) => {
      const queue = this.findQueueWithLeastTime();
      if (queue) {
        queue.queuedItems.push(item);
      }
    });

    this.rebuildQueue();
  }

  /**
   * Cleanup
   */
  private destroy(): void {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.productionComponent = undefined;
    this.researchComponent = undefined;
    this.unifiedQueue = [];
    this.queueChangedSubject.next([]);
  }
}
