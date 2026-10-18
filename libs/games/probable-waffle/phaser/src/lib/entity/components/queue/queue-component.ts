import { HealthComponent } from "../combat/components/health-component";
import { SharedQueueCancellation } from "./cancel-shared-queue-item";
import { mutateSharedQueueItem } from "./mutate-shared-queue-item";
import { advanceSharedQueueItem } from "./advance-shared-queue-item";
import { projectSharedQueueItems } from "./project-shared-queue-items";
import { restoreSharedQueues, snapshotSharedQueues } from "./shared-queue-snapshot";
import type { SharedQueueSnapshotData } from "@fuzzy-waddle/probable-waffle-protocol";
import { Subject } from "rxjs";
import type { SharedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/shared-queue-item";
import { ProductionComponent } from "../production/production-component";
import { ResearchComponent } from "../research/research-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { SharedQueue } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/shared-queue";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { ProductionQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/game-object";
import Phaser from "phaser";
import type { Subscription } from "rxjs";
import type { QueueDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/queue-definition";
import { getActorComponent } from "../../../data/actor-component";
import { addActorComponent } from "../../../data/actor-data";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { reportQueueTerminalOutcome } from "./report-queue-terminal-outcome";
import type {
  CancelProductionCommand,
  CancelResearchCommand,
  GameCommandOutcomeKind
} from "@fuzzy-waddle/probable-waffle-protocol";
import { fenceSceneResourceHistory } from "../../../data/scene-resource-observation";

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
  private simulationTickSub?: Subscription;
  private disposed = false;
  /** Invalidates pre-restore completion continuations; callback reentry never advances or cancels a second handle. */
  private generation = 0;
  private updating = false;
  private cancelling = false;

  constructor(
    readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly queueDefinition: QueueDefinition
  ) {
    this.capacityPerQueue = queueDefinition.capacityPerQueue;

    // Initialize queues
    for (let i = 0; i < queueDefinition.queueCount; i++) {
      this.sharedQueues.push(new SharedQueue(queueDefinition.capacityPerQueue));
    }

    this.simulationTickSub = getSceneService(gameObject.scene, SimulationTickService)?.tick$.subscribe(() =>
      this.update()
    );
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
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
    if (this.disposed || this.updating || !this.gameObject.scene) return;
    if (getActorComponent(this.gameObject, HealthComponent)?.killed) {
      this.destroy();
      return;
    }
    const deltaWithTimeScale = SimulationTickService.TICK_INTERVAL_MS;
    if (deltaWithTimeScale <= 0) return;

    this.updating = true;
    const generation = this.generation;
    try {
      // Process each queue's first item
      for (let queueIndex = 0; queueIndex < this.sharedQueues.length; queueIndex++) {
        if (this.disposed || this.generation !== generation) break;
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
    } finally {
      this.updating = false;
    }
  }

  /**
   * Process a production item in the queue
   */
  private processProductionItem(queue: SharedQueue, queueIndex: number, delta: number): void {
    const firstItem = queue.queuedItems[0]!;
    const generation = this.generation;
    if (!firstItem.productionData || !this.productionComponent) return;

    const { costData } = firstItem.productionData;

    if (costData.costType === PaymentType.PayOverTime && !this.productionComponent) return;

    // Shared affordability and progress retain their existing ordering; the diagnostic finish samples the real decrement.
    if (
      firstItem.remainingTime > 0 &&
      !advanceSharedQueueItem(this.gameObject, firstItem, delta, () => {
        if (costData.costType !== PaymentType.PayOverTime) return true;
        return this.productionComponent?.handlePayOverTimePayment(costData.resources, firstItem) ?? false;
      })
    )
      return;

    if (!this.isCurrentHead(queue, firstItem, generation)) return;
    const progress =
      firstItem.totalTime === 0 ? 100 : ((firstItem.totalTime - firstItem.remainingTime) / firstItem.totalTime) * 100;

    // Emit progress event via ProductionComponent
    if (this.productionComponent) {
      this.productionComponent.emitProductionProgress({
        queueIndex: queueIndex,
        queueItemIndex: 0,
        progressInPercentage: Math.min(progress, 100)
      });
    }

    // Check completion
    if (firstItem.remainingTime <= 0 && this.isCurrentHead(queue, firstItem, generation)) {
      this.completeProductionItem(queue, queueIndex);
    }
  }

  /**
   * Process a research item in the queue
   */
  private processResearchItem(queue: SharedQueue, queueIndex: number, delta: number): void {
    const firstItem = queue.queuedItems[0]!;
    const generation = this.generation;
    if (!firstItem.researchData || !this.researchComponent) return;

    advanceSharedQueueItem(this.gameObject, firstItem, delta, () => true);
    if (!this.isCurrentHead(queue, firstItem, generation)) return;

    const progress =
      firstItem.totalTime === 0 ? 100 : ((firstItem.totalTime - firstItem.remainingTime) / firstItem.totalTime) * 100;

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
    if (firstItem.remainingTime <= 0 && this.isCurrentHead(queue, firstItem, generation)) {
      this.completeResearchItem(queue, queueIndex);
    }
  }

  /**
   * Complete a production item - delegate to ProductionComponent for spawning
   */
  private completeProductionItem(queue: SharedQueue, queueIndex: number): void {
    const generation = this.generation;
    const item = queue.queuedItems[0]!;
    if (item.type !== QueueItemType.Production || !item.productionData) return;

    // Remove from queue
    mutateSharedQueueItem(
      { producer: this.gameObject, item, queueIndex, itemIndex: 0, operation: "complete_remove" },
      () => {
        queue.queuedItems.splice(0, 1);
      }
    );

    // Delegate to ProductionComponent for spawning logic
    if (this.disposed || generation !== this.generation) return;
    let producedActorId: string | null = null;
    let failure: string | undefined;
    try {
      if (this.productionComponent) {
        producedActorId = this.productionComponent.handleProductionComplete(item.productionData, item);
      }
    } catch {
      failure = "production_completion_failed";
    }
    if (this.disposed || generation !== this.generation) return;
    this.reportTerminalOutcome(
      item,
      producedActorId ? "completed" : "failed",
      producedActorId ? [producedActorId] : [],
      producedActorId ? undefined : (failure ?? "no_legal_spawn_location")
    );

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
    const generation = this.generation;
    const item = queue.queuedItems[0]!;
    if (item.type !== QueueItemType.Research || !item.researchData) return;

    // Remove from queue
    mutateSharedQueueItem(
      { producer: this.gameObject, item, queueIndex, itemIndex: 0, operation: "complete_remove" },
      () => {
        queue.queuedItems.splice(0, 1);
      }
    );

    // Delegate to ResearchComponent for tech tree registration
    if (this.disposed || generation !== this.generation) return;
    if (this.researchComponent) {
      this.researchComponent.handleResearchComplete(item.researchData, item);
    }
    if (this.disposed || generation !== this.generation) return;
    this.reportTerminalOutcome(item, "completed", [`research:${item.researchData}`]);

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
  addItem(item: UnifiedQueueItem, expectedGeneration = this.generation): void {
    if (this.disposed) throw new Error("Queue owner is disposed");
    if (expectedGeneration !== this.generation) throw new Error("Queue owner changed during purchase");
    const queue = this.findQueueWithLeastTime();
    if (!queue) {
      throw new Error("No queue available");
    }

    // Initialize remainingTime if not set
    if (item.remainingTime === undefined) {
      item.remainingTime = item.totalTime;
    }

    mutateSharedQueueItem(
      {
        producer: this.gameObject,
        item,
        queueIndex: this.sharedQueues.indexOf(queue),
        itemIndex: queue.queuedItems.length,
        operation: "enqueue"
      },
      () => {
        queue.queuedItems.push(item);
      }
    );

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
  cancelProductionItem(item: ProductionQueueItem, cancellationCommand?: CancelProductionCommand): boolean {
    if (this.disposed || this.cancelling) return false;
    this.cancelling = true;
    try {
      return this.cancellation().cancelProductionItem(item, cancellationCommand);
    } finally {
      this.cancelling = false;
    }
  }

  /** Public API: cancel the currently addressed research head through its native refund path. */
  cancelResearchItem(cancellationCommand?: CancelResearchCommand): boolean {
    if (this.disposed || this.cancelling) return false;
    this.cancelling = true;
    try {
      return this.cancellation().cancelResearchItem(cancellationCommand);
    } finally {
      this.cancelling = false;
    }
  }

  private cancellation(): SharedQueueCancellation {
    return new SharedQueueCancellation(
      this.gameObject,
      this.sharedQueues,
      this.productionComponent,
      this.researchComponent,
      (item, kind, links, detail) => this.reportTerminalOutcome(item, kind, links, detail),
      () => this.notifyQueueChanged()
    );
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
    return queue.queuedItems.reduce((total, item) => total + item.remainingTime, 0);
  }

  /**
   * Public API: Get queue with least remaining time (for validation)
   */
  findQueueForNewItem(): SharedQueue | undefined {
    return this.disposed ? undefined : this.findQueueWithLeastTime();
  }

  /**
   * Public API: Get total remaining production time across all queues
   */
  getTotalRemainingProductionTime(): number {
    return this.sharedQueues.reduce((total, queue) => total + this.getTotalRemainingTimeForQueue(queue), 0);
  }

  /**
   * Public API: Get progress for a specific queue
   */
  getQueueProgress(queue: SharedQueue): number | null {
    if (queue.queuedItems.length === 0) return null;

    const firstItem = queue.queuedItems[0]!;
    const totalTime = firstItem.totalTime;
    const remainingTime = firstItem.remainingTime;

    return totalTime === 0 ? 100 : ((totalTime - remainingTime) / totalTime) * 100;
  }

  /**
   * Public API: Check if any queue is producing
   */
  get isProducing(): boolean {
    return this.sharedQueues.some((queue) => queue.queuedItems.length > 0);
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
    return projectSharedQueueItems(this.sharedQueues, (queue) => this.getQueueProgress(queue));
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

  private reportTerminalOutcome(
    item: UnifiedQueueItem,
    kind: Extract<GameCommandOutcomeKind, "completed" | "cancelled" | "failed">,
    worldLinkIds: readonly string[],
    detail?: string
  ): void {
    reportQueueTerminalOutcome(this.gameObject, item, kind, worldLinkIds, detail);
  }

  /**
   * Get serialized data for save/load
   */
  getData(): UnifiedQueueItem[] {
    return structuredClone(this.allItems);
  }

  /** Local lifetime token for a synchronous payment-to-insertion boundary; it is not persisted command authority. */
  get workGeneration(): number {
    return this.generation;
  }

  /** Preferred actor save: preserves mixed lane order, original payment policy and command lineage. */
  getSnapshotData(): SharedQueueSnapshotData {
    return snapshotSharedQueues(this.sharedQueues);
  }

  /** Replaces every lane atomically without charging or emitting completion callbacks. */
  setSnapshotData(data: SharedQueueSnapshotData): void {
    if (this.disposed) return;
    const replacement = restoreSharedQueues(data, this.sharedQueues.length, this.capacityPerQueue);
    fenceSceneResourceHistory(this.gameObject.scene, "resource_queue_restore");
    this.generation += 1;
    this.sharedQueues = replacement;
    this.notifyQueueChanged();
  }

  /**
   * Set data from save/load
   */
  setData(items: UnifiedQueueItem[]): void {
    if (this.disposed) return;
    fenceSceneResourceHistory(this.gameObject.scene, "resource_queue_restore");
    this.generation += 1;
    // Clear existing queues
    this.sharedQueues.forEach((queue) => {
      queue.queuedItems = [];
    });

    // Rebuild queues from saved items (items already have their remainingTime set)
    items.forEach((item) => {
      const queue = this.findQueueWithLeastTime();
      if (queue) {
        queue.queuedItems.push(structuredClone(item));
      }
    });

    this.notifyQueueChanged();
  }

  /** Compatibility for old component saves: repeated type-specific restores replace that work, retaining the other kind. */
  replaceLegacyItems(type: QueueItemType, items: UnifiedQueueItem[]): void {
    this.setData([...this.allItems.filter((item) => item.type !== type), ...items]);
  }

  /**
   * Cleanup
   */
  private destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation += 1;
    if (this.gameObject.scene?.sys.isActive()) {
      for (const item of this.allItems) {
        this.reportTerminalOutcome(item, "failed", [], "queue_owner_destroyed");
      }
    }
    this.simulationTickSub?.unsubscribe();
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.gameObject.off(HealthComponent.KilledEvent, this.destroy, this);
    this.sharedQueues.forEach((queue) => {
      queue.queuedItems = [];
    });
    this.productionComponent = undefined;
    this.researchComponent = undefined;
    this.queueChangedSubject.next([]);
    this.queueChangedSubject.complete();
  }

  /** A progress observer may synchronously cancel/restore; completion must still refer to the exact live head. */
  private isCurrentHead(queue: SharedQueue, item: UnifiedQueueItem, generation: number): boolean {
    return !this.disposed && generation === this.generation && queue.queuedItems[0] === item;
  }
}
