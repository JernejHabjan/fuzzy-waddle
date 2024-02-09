import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../../building/container-component";
import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../actor/components/owner-component";
import GameObject = Phaser.GameObjects.GameObject;

export type ResourceDrainDefinition = {
  resourceTypes: ResourceType[];
};

// this is to be applied to townHall/mine/lodge where resources can be returned to
export class ResourceDrainComponent {
  onResourcesReturned: Subject<[ResourceType, number, GameObject]> = new Subject<[ResourceType, number, GameObject]>();
  private containerComponent?: ContainerComponent;
  private gathererMustEnter = false;
  private gathererCapacity = 0;

  constructor(
    private readonly gameObject: GameObject,
    private readonly resourceDrainDefinition: ResourceDrainDefinition
  ) {
    this.init();
  }

  init(): void {
    this.containerComponent = getActorComponent(this.gameObject, ContainerComponent);
    this.gathererCapacity = this.containerComponent?.containerDefinition.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
  }

  /**
   * returns resources to player controller
   */
  returnResources(gatherer: GameObject, resourceType: ResourceType, amount: number): number {
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    // todo if (!ownerComponent.playerController) throw new Error("ownerComponent.playerController is null");
    // todo const playerResourcesComponent = ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);

    const returnedResources = 0; // todo playerResourcesComponent.addResource(resourceType, amount);

    if (returnedResources <= 0) {
      return 0;
    }

    // notify listeners
    this.onResourcesReturned.next([resourceType, amount, gatherer]);

    return returnedResources;
  }

  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getResourceTypes(): ResourceType[] {
    return this.resourceDrainDefinition.resourceTypes;
  }
}
