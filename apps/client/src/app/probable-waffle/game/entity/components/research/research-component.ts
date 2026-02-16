import { EventEmitter } from "@angular/core";
import { researchDefinitions } from "./research-definitions";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { addActorComponent } from "../../../data/actor-data";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { onObjectReady } from "../../../data/game-object-helper";
import type { ResearchComponentData, ResearchType } from "@fuzzy-waddle/api-interfaces";
import { SharedQueueComponent } from "../queue/shared-queue-component";
import { QueueItemType, type UnifiedQueueItem } from "../queue/queue-item";
import Phaser from "phaser";

export interface ResearchDefinition {
  availableResearch: ResearchType[];
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
    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.techTreeService = getSceneService(this.gameObject.scene, TechTreeService);

    // Create or get SharedQueueComponent and register this research component
    let sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) {
      sharedQueue = new SharedQueueComponent(this.gameObject, 1, 1);
      addActorComponent(this.gameObject, sharedQueue);
    }
    sharedQueue.registerResearchComponent(this);
  }

  get availableResearch(): ResearchType[] {
    return this.researchDefinition.availableResearch;
  }

  get isResearching(): boolean {
    const sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) return false;

    return sharedQueue.allItems.some((item) => item.type === QueueItemType.Research);
  }

  get currentResearchType(): ResearchType | undefined {
    const sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) return undefined;

    for (const queue of sharedQueue.queues) {
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

  /**
   * Start research - delegates to SharedQueueComponent
   */
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

    // Delegate to SharedQueueComponent
    const sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) {
      console.error("SharedQueueComponent not found");
      return false;
    }

    const unifiedItem: UnifiedQueueItem = {
      type: QueueItemType.Research,
      researchData: type,
      totalTime: researchData.researchTime
    };

    sharedQueue.addItem(unifiedItem);

    this.researchStarted.emit(type);
    this.gameObject.emit(ResearchComponent.ResearchStartedEvent, type);

    return true;
  }

  /**
   * Called by SharedQueueComponent when research completes.
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

  /**
   * Public method for SharedQueueComponent to handle research refunds.
   * Called during cancellation.
   */
  public handleResearchRefund(type: ResearchType, remainingTime: number, totalTime: number): void {
    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) return;

    const researchData = researchDefinitions[type];
    if (!researchData) return;

    // Calculate refund based on progress
    const progress = (totalTime - remainingTime) / totalTime;
    const refundFactor = researchData.refundFactor * (1 - progress);

    const refundedResources: Partial<Record<string, number>> = {};
    for (const [resourceType, amount] of Object.entries(researchData.cost)) {
      if (amount !== undefined) {
        refundedResources[resourceType] = Math.floor(amount * refundFactor);
      }
    }

    emitResource(this.gameObject.scene, "resource.added", refundedResources, owner);
  }

  /**
   * Cancel research - delegates to SharedQueueComponent
   */
  cancelResearch(): boolean {
    const sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) {
      return false;
    }

    return sharedQueue.cancelResearchItem();
  }

  getResearchProgress(type: ResearchType): number {
    const sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
    if (!sharedQueue) return 0;

    // Find the research item in queues
    for (const queue of sharedQueue.queues) {
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
    // Research state is now stored in SharedQueueComponent
    return {
      currentResearch: undefined,
      remainingTime: 0
    };
  }

  setData(data: Partial<ResearchComponentData>): void {
    // Migrate old save data: if currentResearch exists, add it to SharedQueue
    if (data.currentResearch) {
      const sharedQueue = getActorComponent(this.gameObject, SharedQueueComponent);
      if (sharedQueue) {
        const researchData = researchDefinitions[data.currentResearch as ResearchType];
        if (researchData) {
          const unifiedItem: UnifiedQueueItem = {
            type: QueueItemType.Research,
            researchData: data.currentResearch as ResearchType,
            totalTime: researchData.researchTime
          };

          // Add to shared queue
          sharedQueue.addItem(unifiedItem);

          // Update the queue's remaining time to match saved progress
          if (sharedQueue.queues.length > 0) {
            for (const queue of sharedQueue.queues) {
              if (queue.queuedItems.length > 0) {
                const lastItem = queue.queuedItems[queue.queuedItems.length - 1];
                if (lastItem === unifiedItem) {
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
}
