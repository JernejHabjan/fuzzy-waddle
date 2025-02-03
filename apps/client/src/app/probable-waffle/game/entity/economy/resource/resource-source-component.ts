import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectTransform } from "../../../data/game-object-helper";
import GameObject = Phaser.GameObjects.GameObject;

export type ResourceSourceDefinition = {
  resourceType: ResourceType;
  maximumResources: number;
  gatheringFactor: number;
};

export class ResourceSourceComponent {
  private static readonly debug = false;
  onResourcesChanged: Subject<[ResourceType, number, GameObject]> = new Subject<[ResourceType, number, GameObject]>();
  onDepleted: Subject<GameObject> = new Subject<GameObject>();
  private currentResources: number;
  private containerComponent?: ContainerComponent;
  private gathererMustEnter = false;
  private maximumCapacity = 0;
  private currentCapacity = 0;
  private depletedImage?: Phaser.GameObjects.Image;
  private scene?: Phaser.Scene;

  constructor(
    private readonly gameObject: GameObject,
    private readonly resourceSourceDefinition: ResourceSourceDefinition
  ) {
    this.currentResources = this.resourceSourceDefinition.maximumResources;
    this.init();
  }

  init(): void {
    this.containerComponent = getActorComponent(this.gameObject, ContainerComponent);
    this.maximumCapacity = this.containerComponent?.containerDefinition.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
    this.scene = this.gameObject.scene;
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  async extractResources(gatherer: GameObject, amount: number): Promise<number> {
    if (this.gathererMustEnter) {
      this.currentCapacity += 1;
      this.containerComponent?.loadGameObject(gatherer);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000); // todo read cooldown from elsewhere
    });

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
      const transform = getGameObjectTransform(this.gameObject);
      this.gameObject.destroy();
      this.spawnTreeTrunk(transform);
    }
    return gatheredAmount;
  }

  private spawnTreeTrunk(transform: Phaser.GameObjects.Components.Transform | null) {
    if (!transform) return;
    if (!this.scene) return;

    let texture;
    let frame;
    switch (this.resourceSourceDefinition.resourceType) {
      case ResourceType.Wood:
        texture = "outside";
        frame = "foliage/tree_trunks/tree_fallen.png";
        break;
      case ResourceType.Stone:
        texture = "outside"; // todo
        frame = "foliage/tree_trunks/tree_fallen.png"; // todo
        break;
      case ResourceType.Minerals:
        texture = "outside"; // todo
        frame = "foliage/tree_trunks/tree_fallen.png"; // todo
        break;
      case ResourceType.Ambrosia:
        texture = "outside"; // todo
        frame = "foliage/tree_trunks/tree_fallen.png"; // todo
        break;
    }

    this.depletedImage = this.scene.add.image(transform.x, transform.y, texture, frame);
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

  private destroy() {
    this.depletedImage?.destroy();
  }
}
