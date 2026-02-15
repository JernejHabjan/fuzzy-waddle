import { Subject, Subscription } from "rxjs";
import type { UnifiedQueueItem } from "./unified-queue-item";
import { QueueItemType } from "./queue-item-type";
import type { ProductionComponent } from "../production/production-component";
import type { ResearchComponent } from "../research/research-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { researchDefinitions } from "../research/research-definitions";
import Phaser from "phaser";

/**
 * DisplayQueueComponent aggregates production and research queues
 * into a unified display queue for UI consumption.
 *
 * This component observes ProductionComponent and ResearchComponent
 * and combines their states into a single queue that ActorInfoLabels can subscribe to.
 */
export class DisplayQueueComponent {
  private queueChangedSubject = new Subject<UnifiedQueueItem[]>();
  private productionSubscription?: Subscription;
  private researchProgressSubscription?: Subscription;
  private researchStartedSubscription?: Subscription;
  private researchCompletedSubscription?: Subscription;
  private researchCancelledSubscription?: Subscription;

  private productionComponent?: ProductionComponent;
  private researchComponent?: ResearchComponent;
  private unifiedQueue: UnifiedQueueItem[] = [];

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
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
  get items(): UnifiedQueueItem[] {
    return [...this.unifiedQueue];
  }

  /**
   * Set the production component to observe
   */
  setProductionComponent(productionComponent: ProductionComponent | undefined) {
    // Unsubscribe from previous component
    this.productionSubscription?.unsubscribe();
    this.productionComponent = productionComponent;

    if (productionComponent) {
      // Subscribe to production queue changes
      this.productionSubscription = productionComponent.queueChangeObservable.subscribe(() => {
        this.rebuildQueue();
      });
    }

    this.rebuildQueue();
  }

  /**
   * Set the research component to observe
   */
  setResearchComponent(researchComponent: ResearchComponent | undefined) {
    // Unsubscribe from previous component
    this.researchProgressSubscription?.unsubscribe();
    this.researchStartedSubscription?.unsubscribe();
    this.researchCompletedSubscription?.unsubscribe();
    this.researchCancelledSubscription?.unsubscribe();
    this.researchComponent = researchComponent;

    if (researchComponent) {
      // Subscribe to research events
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

    this.rebuildQueue();
  }

  /**
   * Rebuild the unified queue from production and research components
   */
  private rebuildQueue() {
    const newQueue: UnifiedQueueItem[] = [];
    let displayIndex = 0;

    // Add research items first (they take priority in display)
    if (this.researchComponent) {
      const currentResearchType = this.researchComponent.currentResearchType;
      if (currentResearchType) {
        const researchData = researchDefinitions[currentResearchType];
        if (researchData && researchData.icon) {
          const progress = this.researchComponent.getResearchProgress(currentResearchType);
          newQueue.push({
            type: QueueItemType.Research,
            id: `research-${currentResearchType}`,
            iconData: {
              key: researchData.icon.key,
              frame: researchData.icon.frame,
              origin: { x: 0.5, y: 0.5 }
            },
            progressPercent: progress,
            displayIndex: displayIndex++,
            researchData: currentResearchType
          });
        }
      }
    }

    // Add production items after research
    if (this.productionComponent) {
      const productionItems = this.productionComponent.itemsFromAllQueues;
      productionItems.forEach((item, index) => {
        const actorDefinition = pwActorDefinitions[item.actorName];
        const infoComponent = actorDefinition.components?.info;
        if (infoComponent?.smallImage) {
          // Calculate progress for this production item
          // Note: Progress calculation should come from production component events
          // For now, we'll use 0 and rely on production progress events to update
          newQueue.push({
            type: QueueItemType.Production,
            id: `production-${index}`,
            iconData: {
              key: infoComponent.smallImage.key,
              frame: infoComponent.smallImage.frame,
              origin: infoComponent.smallImage.origin
            },
            progressPercent: 0, // Will be updated by progress events
            displayIndex: displayIndex++,
            productionData: item
          });
        }
      });
    }

    this.unifiedQueue = newQueue;
    this.queueChangedSubject.next(this.unifiedQueue);
  }

  /**
   * Update progress for a specific item
   */
  updateProgress(id: string, progressPercent: number) {
    const item = this.unifiedQueue.find(i => i.id === id);
    if (item) {
      item.progressPercent = progressPercent;
      this.queueChangedSubject.next(this.unifiedQueue);
    }
  }

  /**
   * Clear all subscriptions and state
   */
  clear() {
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

  private destroy() {
    this.clear();
  }
}
