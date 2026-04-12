import { type ResourceSourceComponentData, ResourceType, type Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectRenderedTransform } from "../../../data/game-object-helper";
import type { ResourceSourceDefinition } from "./resource-source-definition";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";
import GameObject = Phaser.GameObjects.GameObject;

export class ResourceSourceComponent {
  private static readonly debug = false;
  onResourcesChanged: Subject<[ResourceType, number, GameObject]> = new Subject<[ResourceType, number, GameObject]>();
  onDepleted: Subject<GameObject> = new Subject<GameObject>();
  onAssignedGatherersChanged: Subject<number> = new Subject<number>();
  private currentResources: number;
  private containerComponent?: ContainerComponent;
  private gathererMustEnter = false;
  private currentCapacity = 0;
  private depletedImage?: Phaser.GameObjects.Image;
  private scene?: Phaser.Scene;
  private assignedGatherers: Set<GameObject> = new Set();

  constructor(
    private readonly gameObject: GameObject,
    public readonly resourceSourceDefinition: ResourceSourceDefinition
  ) {
    this.currentResources = this.resourceSourceDefinition.maximumResources;
    this.init();
  }

  init(): void {
    this.containerComponent = getActorComponent(this.gameObject, ContainerComponent);
    this.gathererMustEnter = !!this.containerComponent;
    this.scene = this.gameObject.scene;
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  async extractResources(gatherer: GameObject, amount: number): Promise<number> {
    if (this.gathererMustEnter) {
      this.currentCapacity += 1;
      this.containerComponent?.loadGameObject(gatherer);
    }

    await waitForSimulationDuration(this.gameObject.scene, this.resourceSourceDefinition.cooldown);

    if (this.gathererMustEnter) {
      this.containerComponent?.unloadGameObject(gatherer);
      this.currentCapacity -= 1;
    }

    const gatheredAmount = Math.min(amount * this.resourceSourceDefinition.gatheringFactor, this.currentResources);

    // deduct resources
    const oldResources = this.currentResources;
    this.currentResources -= gatheredAmount;
    const newResources = this.currentResources;

    if (ResourceSourceComponent.debug) {
      console.log(
        "gatherer",
        gatherer,
        "extracted",
        gatheredAmount,
        this.resourceSourceDefinition.resourceType,
        "from",
        this.gameObject,
        "oldResources",
        oldResources,
        "newResources",
        newResources
      );
    }

    this.onResourcesChanged.next([this.resourceSourceDefinition.resourceType, gatheredAmount, gatherer]);
    // check if we're depleted
    if (this.currentResources <= 0) {
      this.onDepleted.next(this.gameObject);
      const renderedTransform = getGameObjectRenderedTransform(this.gameObject);
      this.gameObject.destroy();
      this.spawnDepletedResourceSourceSprite(renderedTransform);
    }
    return gatheredAmount;
  }

  /**
   * Spawns a depleted resource source image at the given rendered transform position.
   */
  private spawnDepletedResourceSourceSprite(renderedTransform: Vector2Simple | null) {
    if (!renderedTransform) return;
    if (!this.scene) return;

    let texture = null;
    let frame = null;
    switch (this.resourceSourceDefinition.resourceType) {
      case ResourceType.Wood:
        texture = "outside";
        frame = "foliage/tree_trunks/tree_fallen.png";
        break;
      case ResourceType.Stone:
        texture = "outside";
        frame = "nature/resources/stone_pile_depleted_1.png"; // todo - zip to spritesheet
        break;
      case ResourceType.Minerals:
        texture = "outside";
        frame = "nature/resources/minerals_pile_depleted_1.png"; // todo - zip to spritesheet
        break;
    }
    if (!texture || !frame) return;

    this.depletedImage = this.scene.add.image(renderedTransform.x, renderedTransform.y, texture, frame);
  }

  canGathererEnter(gatherer: GameObject): boolean {
    return this.containerComponent?.canLoadGameObject(gatherer) ?? true;
  }

  getResourceType(): ResourceType {
    return this.resourceSourceDefinition.resourceType;
  }

  getMaximumResources(): number {
    return this.resourceSourceDefinition.maximumResources;
  }

  getGatheringFactor(): number {
    return this.resourceSourceDefinition.gatheringFactor;
  }

  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getCurrentResources(): number {
    return this.currentResources;
  }

  /**
   * Register a gatherer as assigned to this resource source
   */
  assignGatherer(gatherer: GameObject): void {
    if (!this.assignedGatherers.has(gatherer)) {
      this.assignedGatherers.add(gatherer);
      this.onAssignedGatherersChanged.next(this.assignedGatherers.size);
    }
  }

  /**
   * Unregister a gatherer from this resource source
   */
  unassignGatherer(gatherer: GameObject): void {
    if (this.assignedGatherers.has(gatherer)) {
      this.assignedGatherers.delete(gatherer);
      this.onAssignedGatherersChanged.next(this.assignedGatherers.size);
    }
  }

  /**
   * Get the count of gatherers currently assigned to this resource
   */
  getAssignedGatherersCount(): number {
    return this.assignedGatherers.size;
  }

  /**
   * Check if this resource source can accept another gatherer
   */
  canAcceptGatherer(): boolean {
    const maxGatherers = this.resourceSourceDefinition.maxGatherers;
    if (maxGatherers === undefined) return true;
    return this.assignedGatherers.size < maxGatherers;
  }

  /**
   * Get the maximum number of gatherers allowed
   */
  getMaxGatherers(): number | undefined {
    return this.resourceSourceDefinition.maxGatherers;
  }

  setData(data: Partial<ResourceSourceComponentData>) {
    if (data.currentResources !== undefined) {
      const max = this.resourceSourceDefinition.maximumResources;
      this.currentResources = Phaser.Math.Clamp(data.currentResources, 0, Math.max(0, max));
    }
  }

  getData(): ResourceSourceComponentData {
    return {
      currentResources: this.currentResources
    } satisfies ResourceSourceComponentData;
  }

  private destroy() {
    this.depletedImage?.destroy();
  }
}
