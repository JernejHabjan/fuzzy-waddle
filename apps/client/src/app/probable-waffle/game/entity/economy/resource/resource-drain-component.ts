import { PlayerStateResources, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource } from "../../../data/scene-data";
import { onObjectReady } from "../../../data/game-object-helper";
import GameObject = Phaser.GameObjects.GameObject;

export type ResourceDrainDefinition = {
  resourceTypes: ResourceType[];
};

// this is to be applied to townHall/mine/lodge where resources can be returned to
export class ResourceDrainComponent {
  onResourcesReturned: Subject<[ResourceType, number, GameObject]> = new Subject<[ResourceType, number, GameObject]>();
  private containerComponent?: ContainerComponent;
  private gathererMustEnter = false;
  private maximumGathererCapacity = 0;
  private currentCapacity = 0;

  constructor(
    private readonly gameObject: GameObject,
    private readonly resourceDrainDefinition: ResourceDrainDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
  }

  init(): void {
    this.containerComponent = getActorComponent(this.gameObject, ContainerComponent);
    this.maximumGathererCapacity = this.containerComponent?.containerDefinition.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
  }

  canDropOffResources(): boolean {
    const capacityReached = this.currentCapacity >= this.maximumGathererCapacity;
    return !capacityReached;
  }

  /**
   * returns resources to player controller
   */
  async returnResources(gatherer: GameObject, resourceType: ResourceType, amount: number): Promise<number> {
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

    emitResource(this.gameObject.scene, "resource.added", {
      [resourceType]: amount
    } satisfies Partial<PlayerStateResources>);

    // notify listeners
    this.onResourcesReturned.next([resourceType, amount, gatherer]);

    // we always return full amount
    // noinspection UnnecessaryLocalVariableJS
    const returnedAmount = amount;

    return returnedAmount;
  }

  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getResourceTypes(): ResourceType[] {
    return this.resourceDrainDefinition.resourceTypes;
  }

  getDropOffRange(): number {
    return 1;
  }
}
