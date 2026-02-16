import { Subject, Subscription } from "rxjs";
import type { SharedQueueItem } from "./shared-queue-item";
import { SharedQueueItemType } from "./shared-queue-item-type";
import { ProductionComponent } from "../production/production-component";
import { ResearchComponent } from "../research/research-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { researchDefinitions } from "../research/research-definitions";
import { onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { QueueItemType } from "./queue-item";
import Phaser from "phaser";

/**
 * SharedQueueComponent aggregates production and research queues
 * into a unified queue that represents all pending work for an actor.
 *
 * This is a shared actor component that both ProductionComponent and ResearchComponent
 * register with and update. It provides a single source of truth for queue state.
 */
export class SharedQueueComponent {
  private queueChangedSubject = new Subject<SharedQueueItem[]>();
  private productionSubscription?: Subscription;
  private researchProgressSubscription?: Subscription;
  private researchStartedSubscription?: Subscription;
  private researchCompletedSubscription?: Subscription;
  private researchCancelledSubscription?: Subscription;

  private productionComponent?: ProductionComponent;
  private researchComponent?: ResearchComponent;
  private unifiedQueue: SharedQueueItem[] = [];

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private init(): void {
    // Get production and research components if they exist
    this.productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    this.researchComponent = getActorComponent(this.gameObject, ResearchComponent);

    // Subscribe to production component if it exists
    if (this.productionComponent) {
      this.subscribeToProduction(this.productionComponent);
    }

    // Subscribe to research component if it exists
    if (this.researchComponent) {
      this.subscribeToResearch(this.researchComponent);
    }

    // Initial queue build
    this.rebuildQueue();
  }

  /**
   * Observable that emits whenever the unified queue changes
   */
  get queueChangedObservable() {
    return this.queueChangedSubject.asObservable();
  }

  /**
   * Get the current unified queue items
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
   * Register production component (called by ProductionComponent on creation)
   */
  registerProductionComponent(productionComponent: ProductionComponent): void {
    // Unsubscribe from previous component
    this.productionSubscription?.unsubscribe();
    this.productionComponent = productionComponent;
    this.subscribeToProduction(productionComponent);
    this.rebuildQueue();
  }

  /**
   * Register research component (called by ResearchComponent on creation)
   */
  registerResearchComponent(researchComponent: ResearchComponent): void {
    // Unsubscribe from previous component
    this.researchProgressSubscription?.unsubscribe();
    this.researchStartedSubscription?.unsubscribe();
    this.researchCompletedSubscription?.unsubscribe();
    this.researchCancelledSubscription?.unsubscribe();
    this.researchComponent = researchComponent;
    this.subscribeToResearch(researchComponent);
    this.rebuildQueue();
  }

  private subscribeToProduction(productionComponent: ProductionComponent): void {
    this.productionSubscription = productionComponent.queueChangeObservable.subscribe(() => {
      this.rebuildQueue();
    });
  }

  private subscribeToResearch(researchComponent: ResearchComponent): void {
    this.researchProgressSubscription = researchComponent.researchProgress.subscribe(() => {
      this.rebuildQueue();
    });
    this.researchStartedSubscription = researchComponent.researchStarted.subscribe(() => {
      this.rebuildQueue();
    });
    this.researchCompletedSubscription = researchComponent.researchCompleted.subscribe(() => {
      this.rebuildQueue();
    });
    this.researchCancelledSubscription = researchComponent.researchCancelled.subscribe(() => {
      this.rebuildQueue();
    });
  }

  /**
   * Rebuild the unified queue from production component's queues
   * (which now contain both production and research items)
   */
  private rebuildQueue(): void {
    const newQueue: SharedQueueItem[] = [];
    let displayIndex = 0;

    if (!this.productionComponent) {
      this.unifiedQueue = newQueue;
      this.queueChangedSubject.next(this.unifiedQueue);
      return;
    }

    // Iterate through all production queues and collect items
    for (const queue of this.productionComponent.productionQueues) {
      for (let i = 0; i < queue.queuedItems.length; i++) {
        const item = queue.queuedItems[i]!;

        // Calculate progress (only for first item in queue)
        const progress = i === 0
          ? (this.productionComponent.getQueueProgress(queue) ?? 0)
          : 0;

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
   * Clear all subscriptions and state
   */
  private clear(): void {
    this.productionSubscription?.unsubscribe();
    this.researchProgressSubscription?.unsubscribe();
    this.researchStartedSubscription?.unsubscribe();
    this.researchCompletedSubscription?.unsubscribe();
    this.researchCancelledSubscription?.unsubscribe();
    this.productionComponent = undefined;
    this.researchComponent = undefined;
    this.unifiedQueue = [];
    this.queueChangedSubject.next([]);
  }

  private destroy(): void {
    this.clear();
  }
}
