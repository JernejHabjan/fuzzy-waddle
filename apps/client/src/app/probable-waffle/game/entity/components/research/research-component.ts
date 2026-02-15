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

  private currentResearch?: ResearchQueueItem;
  private ownerComponent?: OwnerComponent;
  private techTreeService?: TechTreeService;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly researchDefinition: ResearchDefinition
  ) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
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
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  get availableResearch(): ResearchType[] {
    return this.researchDefinition.availableResearch;
  }

  get isResearching(): boolean {
    return this.currentResearch !== undefined;
  }

  get currentResearchType(): ResearchType | undefined {
    return this.currentResearch?.type;
  }

  canStartResearch(type: ResearchType): { canStart: boolean; reason?: string } {
    if (!this.availableResearch.includes(type)) {
      return { canStart: false, reason: "Research not available at this building" };
    }

    if (this.isResearching) {
      return { canStart: false, reason: "Already researching" };
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

    // Start research
    this.currentResearch = {
      type,
      remainingTime: researchData.researchTime
    };

    this.researchStarted.emit(type);
    this.gameObject.emit(ResearchComponent.ResearchStartedEvent, type);

    return true;
  }

  cancelResearch(): boolean {
    if (!this.currentResearch) {
      return false;
    }

    const type = this.currentResearch.type;
    const researchData = researchDefinitions[type];
    if (!researchData) {
      return false;
    }

    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) {
      return false;
    }

    // Calculate refund based on progress and refund factor from research data
    const totalTime = researchData.researchTime;
    const remainingTime = this.currentResearch.remainingTime;
    const progress = (totalTime - remainingTime) / totalTime;
    const refundFactor = researchData.refundFactor * (1 - progress);

    const refundedResources: Partial<Record<string, number>> = {};
    for (const [resourceType, amount] of Object.entries(researchData.cost)) {
      if (amount !== undefined) {
        refundedResources[resourceType] = Math.floor(amount * refundFactor);
      }
    }

    emitResource(this.gameObject.scene, "resource.added", refundedResources, owner);

    this.currentResearch = undefined;
    this.researchCancelled.emit(type);
    this.gameObject.emit(ResearchComponent.ResearchCancelledEvent, type);

    return true;
  }

  getResearchProgress(type: ResearchType): number {
    if (!this.currentResearch || this.currentResearch.type !== type) {
      return 0;
    }

    const researchData = researchDefinitions[type];
    if (!researchData) {
      return 0;
    }

    const totalTime = researchData.researchTime;
    const remainingTime = this.currentResearch.remainingTime;
    return ((totalTime - remainingTime) / totalTime) * 100;
  }

  isResearched(type: ResearchType): boolean {
    const owner = this.ownerComponent?.getOwner();
    if (owner === undefined) {
      return false;
    }
    return this.techTreeService?.isResearched(owner, type) ?? false;
  }

  private update(_time: number, delta: number): void {
    if (!this.currentResearch) {
      return;
    }

    const deltaWithTimeScale = delta * this.gameObject.scene.time.timeScale;
    this.currentResearch.remainingTime -= deltaWithTimeScale;

    const type = this.currentResearch.type;
    const progress = this.getResearchProgress(type);

    this.researchProgress.emit({ type, progress });
    this.gameObject.emit(ResearchComponent.ResearchProgressEvent, { type, progress });

    if (this.currentResearch.remainingTime <= 0) {
      this.completeResearch();
    }
  }

  private completeResearch(): void {
    if (!this.currentResearch) {
      return;
    }

    const type = this.currentResearch.type;
    const owner = this.ownerComponent?.getOwner();

    if (owner !== undefined) {
      this.techTreeService?.registerResearchComplete(owner, type);
    }

    this.currentResearch = undefined;
    this.researchCompleted.emit(type);
    this.gameObject.emit(ResearchComponent.ResearchCompletedEvent, type);
  }

  getData(): ResearchComponentData {
    return {
      currentResearch: this.currentResearch?.type,
      remainingTime: this.currentResearch?.remainingTime ?? 0
    };
  }

  setData(data: Partial<ResearchComponentData>): void {
    if (data.currentResearch) {
      this.currentResearch = {
        type: data.currentResearch as ResearchType,
        remainingTime: data.remainingTime ?? 0
      };
    } else {
      this.currentResearch = undefined;
    }
  }
}
