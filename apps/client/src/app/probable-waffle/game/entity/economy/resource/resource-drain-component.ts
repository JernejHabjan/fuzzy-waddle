import { IComponent } from "../../../core/component.service";
import { Actor } from "../../actor/actor";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent } from "../../building/container-component";
import { OwnerComponent } from "../../actor/components/owner-component";
import { PlayerResourcesComponent } from "../../../world/managers/controllers/player-resources-component";
import { Subject } from "rxjs";

// this is to be applied to townHall/mine/lodge where resources can be returned to
export class ResourceDrainComponent implements IComponent {
  onResourcesReturned: Subject<[ResourceType, number, Actor]> = new Subject<[ResourceType, number, Actor]>();
  private containerComponent: ContainerComponent | null = null;
  private gathererMustEnter = false;
  private gathererCapacity = 0;

  constructor(
    private readonly actor: Actor,
    private readonly resourceTypes: ResourceType[]
  ) {}

  init(): void {
    this.containerComponent = this.actor.components.findComponentOrNull(ContainerComponent);
    this.gathererCapacity = this.containerComponent?.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
  }

  /**
   * returns resources to player controller
   */
  returnResources(gatherer: Actor, resourceType: ResourceType, amount: number): number {
    const ownerComponent = this.actor.components.findComponent(OwnerComponent);
    if (!ownerComponent.playerController) throw new Error("ownerComponent.playerController is null");
    const playerResourcesComponent = ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);

    const returnedResources = playerResourcesComponent.addResource(resourceType, amount);

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
    return this.resourceTypes;
  }
}
