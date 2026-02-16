import { EventEmitter } from "@angular/core";
import { researchDefinitions } from "./research-definitions";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { onObjectReady } from "../../../data/game-object-helper";
import { type ResearchComponentData, type ResearchType } from "@fuzzy-waddle/api-interfaces";
import { QueueComponent } from "../queue/queue-component";
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
    this.createSharedQueue();
  }

  private createSharedQueue() {
    const queue = QueueComponent.createSharedQueue(this.gameObject);
    queue.registerResearchComponent(this);
  }

  get availableResearch(): ResearchType[] {
    return this.researchDefinition.availableResearch;
  }

  get isResearching(): boolean {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) return false;

    return sharedQueue.allItems.some((item) => item.type === QueueItemType.Research);
  }

  get currentResearchType(): ResearchType | undefined {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
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
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) {
      console.error("SharedQueueComponent not found");
      return false;
    }

    const unifiedItem: UnifiedQueueItem = {
      type: QueueItemType.Research,
      researchData: type,
      totalTime: researchData.researchTime,
      remainingTime: researchData.researchTime
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
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) {
      return false;
    }

    return sharedQueue.cancelResearchItem();
  }

  getResearchProgress(type: ResearchType): number {
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) return 0;

    // Find the research item in queues
    for (const queue of sharedQueue.queues) {
      const firstItem = queue.queuedItems[0];
      if (firstItem && firstItem.type === QueueItemType.Research && firstItem.researchData === type) {
        const totalTime = firstItem.totalTime;
        const remainingTime = firstItem.remainingTime;
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
    // Get research state from SharedQueueComponent
    const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
    if (!sharedQueue) {
      return {
        researches: undefined
      };
    }

    // Get all research items with their remaining times
    const researchItems = sharedQueue.allItems
      .filter((item) => item.type === QueueItemType.Research && item.researchData)
      .map((item) => ({
        type: item.researchData!,
        remainingTime: item.remainingTime
      }));

    if (researchItems.length === 0) {
      return {
        researches: undefined
      };
    }

    return {
      researches: researchItems
    };
  }

  setData(data: Partial<ResearchComponentData>): void {
    // Restore research state from save data
    if (data.researches && data.researches.length > 0) {
      this.createSharedQueue();
      const sharedQueue = getActorComponent(this.gameObject, QueueComponent);
      if (!sharedQueue) return;

      const items: UnifiedQueueItem[] = [];

      // Build unified queue items from saved data with per-item progress
      data.researches.forEach((researchItem) => {
        // Handle both new format (ResearchQueueItemData) and legacy format (ResearchType string)
        const researchType = researchItem.type;
        const savedRemainingTime = researchItem.remainingTime;

        const researchData = researchDefinitions[researchType];
        if (!researchData) {
          console.warn(`Unknown research type ${researchType}, skipping...`);
          return;
        }

        const unifiedItem: UnifiedQueueItem = {
          type: QueueItemType.Research,
          researchData: researchType,
          totalTime: researchData.researchTime,
          remainingTime: savedRemainingTime ?? researchData.researchTime // Use saved time or default to full
        };
        items.push(unifiedItem);
      });

      // Add all research items to the queue
      items.forEach((item) => {
        sharedQueue.addItem(item);
      });
    }
  }
}
