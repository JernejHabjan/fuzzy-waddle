import { EventEmitter } from "@angular/core";
import { researchDefinitions } from "./research-definitions";
import { OwnerComponent } from "../owner-component";
import { HealthComponent } from "../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { addActorComponent } from "../../../data/actor-data";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { onObjectReady } from "../../../data/game-object-helper";
import type { ResearchComponentData, ResearchType } from "@fuzzy-waddle/api-interfaces";
import { SharedQueueComponent } from "../queue/shared-queue-component";
import { QueueItemType, type UnifiedQueueItem } from "../queue/queue-item";
import { ProductionComponent } from "../production/production-component";
import Phaser from "phaser";

export interface ResearchDefinition {
  availableResearch: ResearchType[];
}

export interface ResearchQueueItem {
  type: ResearchType;
  remainingTime: number;
}

export class ResearchComponent {
  static readonly ResearchStartedEvent = "researchStarted";
  static readonly ResearchProgressEvent = "researchProgress";
  static readonly ResearchCompletedEvent = "researchCompleted";
  static readonly ResearchCancelledEvent = "researchCancelled";

  researchStarted = new EventEmitter<ResearchType>();
  researchProgress = new EventEmitter<{ type: ResearchType; progress: number }>();
  researchCompleted = new EventEmitter<ResearchType>();
  researchCancelled = new EventEmitter<ResearchType>();

  private ownerComponent?: OwnerComponent;
  private techTreeService?: TechTreeService;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly researchDefinition: ResearchDefinition
  ) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.techTreeService = getSceneService(this.gameObject.scene, TechTreeService);

    // Create or get SharedQueueComponent and register this research component
    let sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) {
      sharedQueue = new SharedQueueComponent(this.gameObject);
      addActorComponent(this.gameObject, sharedQueue);
    }
    sharedQueue.registerResearchComponent(this);
  }

  private destroy(): void {
    // Cleanup if needed
  }

  get availableResearch(): ResearchType[] {
    return this.researchDefinition.availableResearch;
  }

  get isResearching(): boolean {
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) return false;

    // Check if any production queue has a research item
    for (const queue of productionComponent.productionQueues) {
      for (const item of queue.queuedItems) {
        if (item.type === QueueItemType.Research) {
          return true;
        }
      }
    }
    return false;
  }

  get currentResearchType(): ResearchType | undefined {
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) return undefined;

    // Find the first research item in any queue
    for (const queue of productionComponent.productionQueues) {
      if (queue.queuedItems.length > 0) {
        const firstItem = queue.queuedItems[0]!;
        if (firstItem.type === QueueItemType.Research) {
          return firstItem.researchData;
        }
      }
    }
    return undefined;
  }

  canStartResearch(type: ResearchType): { canStart: boolean; reason?: string } {
    if (!this.availableResearch.includes(type)) {
      return { canStart: false, reason: "Research not available at this building" };
    }

    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) {
      return { canStart: false, reason: "No owner" };
    }

    // Check if already researched
    if (this.techTreeService?.isResearched(owner, type)) {
      return { canStart: false, reason: "Already researched" };
    }

    // Check if player has enough resources
    const researchData = researchDefinitions[type];
    if (!researchData) {
      return { canStart: false, reason: "Unknown research type" };
    }

    const player = getPlayer(this.gameObject.scene, owner);
    if (!player) {
      return { canStart: false, reason: "Player not found" };
    }

    if (!player.canPayAllResources(researchData.cost)) {
      return { canStart: false, reason: "Not enough resources" };
    }

    return { canStart: true };
  }

  startResearch(type: ResearchType): boolean {
    const { canStart } = this.canStartResearch(type);
    if (!canStart) {
      return false;
    }

    const researchData = researchDefinitions[type];
    if (!researchData) {
      return false;
    }

    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) {
      return false;
    }

    // Pay resources immediately
    emitResource(this.gameObject.scene, "resource.removed", researchData.cost, owner);

    // Add to production queue system
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) {
      console.error("ProductionComponent not found - research requires production queues");
      return false;
    }

    const unifiedItem: UnifiedQueueItem = {
      type: QueueItemType.Research,
      researchData: type,
      totalTime: researchData.researchTime
    };

    productionComponent.addToQueue(unifiedItem);

    this.researchStarted.emit(type);
    this.gameObject.emit(ResearchComponent.ResearchStartedEvent, type);

    return true;
  }

  /**
   * Called by ProductionComponent when research completes.
   * Registers the research in the tech tree and emits completion events.
   */
  handleResearchComplete(type: ResearchType): void {
    const owner = this.ownerComponent?.getOwner();
    if (owner !== undefined) {
      this.techTreeService?.registerResearchComplete(owner, type);
    }

    this.researchCompleted.emit(type);
    this.gameObject.emit(ResearchComponent.ResearchCompletedEvent, type);
  }

  cancelResearch(): boolean {
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) {
      return false;
    }

    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) {
      return false;
    }

    // Find the first research item in queues (typically the currently processing one)
    for (const queue of productionComponent.productionQueues) {
      const firstItem = queue.queuedItems[0];
      if (firstItem && firstItem.type === QueueItemType.Research && firstItem.researchData) {
        const type = firstItem.researchData;
        const researchData = researchDefinitions[type];
        if (!researchData) {
          return false;
        }

        // Calculate refund based on progress
        const totalTime = researchData.researchTime;
        const remainingTime = queue.remainingProductionTime;
        const progress = (totalTime - remainingTime) / totalTime;
        const refundFactor = researchData.refundFactor * (1 - progress);

        const refundedResources: Partial<Record<string, number>> = {};
        for (const [resourceType, amount] of Object.entries(researchData.cost)) {
          if (amount !== undefined) {
            refundedResources[resourceType] = Math.floor(amount * refundFactor);
          }
        }

        emitResource(this.gameObject.scene, "resource.added", refundedResources, owner);

        // Remove from queue
        queue.queuedItems.splice(0, 1);

        // Reset queue if there are more items
        if (queue.queuedItems.length > 0) {
          productionComponent.resetQueue(queue);
        }

        this.researchCancelled.emit(type);
        this.gameObject.emit(ResearchComponent.ResearchCancelledEvent, type);

        return true;
      }
    }

    return false;
  }

  getResearchProgress(type: ResearchType): number {
    const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
    if (!productionComponent) return 0;

    // Find the research item in queues
    for (const queue of productionComponent.productionQueues) {
      const firstItem = queue.queuedItems[0];
      if (firstItem && firstItem.type === QueueItemType.Research && firstItem.researchData === type) {
        const totalTime = firstItem.totalTime;
        const remainingTime = queue.remainingProductionTime;
        return ((totalTime - remainingTime) / totalTime) * 100;
      }
    }

    return 0;
  }

  isResearched(type: ResearchType): boolean {
    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) {
      return false;
    }
    return this.techTreeService?.isResearched(owner, type) ?? false;
  }

  getData(): ResearchComponentData {
    // Research state is now stored in ProductionComponent queues
    return {
      currentResearch: undefined,
      remainingTime: 0
    };
  }

  setData(data: Partial<ResearchComponentData>): void {
    // Migrate old save data: if currentResearch exists, add it to production queues
    if (data.currentResearch) {
      const productionComponent = getActorComponent(this.gameObject, ProductionComponent);
      if (productionComponent) {
        const researchData = researchDefinitions[data.currentResearch as ResearchType];
        if (researchData) {
          const unifiedItem: UnifiedQueueItem = {
            type: QueueItemType.Research,
            researchData: data.currentResearch as ResearchType,
            totalTime: researchData.researchTime
          };
          // Add to production queue and set remaining time
          productionComponent.addToQueue(unifiedItem);
          // Update the queue's remaining time to match saved progress
          if (productionComponent.productionQueues.length > 0) {
            for (const queue of productionComponent.productionQueues) {
              if (queue.queuedItems.length > 0 && queue.queuedItems[queue.queuedItems.length - 1] === unifiedItem) {
                queue.remainingProductionTime = data.remainingTime ?? researchData.researchTime;
                break;
              }
            }
          }
        }
      }
    }
  }
}
