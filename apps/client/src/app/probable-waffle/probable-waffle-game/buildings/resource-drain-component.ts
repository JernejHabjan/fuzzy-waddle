import { IComponent } from '../services/component.service';
import { Actor } from '../actor';
import { ResourceType } from './resource-type';
import { ContainerComponent } from './container-component';
import { OwnerComponent } from '../characters/owner-component';
import { PlayerResourcesComponent } from '../controllers/player-resources-component';
import { Subject } from 'rxjs';

export interface ResourceDrain {
  resourceDrainComponent: ResourceDrainComponent;
}

// this is to be applied to townHall/mine/lodge where resources can be returned to
export class ResourceDrainComponent implements IComponent {
  private containerComponent: ContainerComponent | null = null;
  private gathererMustEnter = false;
  private gathererCapacity = 0;
  private playerResourcesComponent!: PlayerResourcesComponent;
  onResourcesReturned: Subject<[ResourceType, number, Actor]> = new Subject<[ResourceType, number, Actor]>();
  constructor(private readonly actor: Actor, private readonly resourceTypes: ResourceType[]) {}
  init(): void {
    this.containerComponent = this.actor.components.findComponentOrNull(ContainerComponent);
    this.gathererCapacity = this.containerComponent?.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
    const ownerComponent = this.actor.components.findComponent(OwnerComponent);
    this.playerResourcesComponent = ownerComponent.playerController.components.findComponent(PlayerResourcesComponent);
  }

  /**
   * returns resources to player controller
   */
  returnResources(gatherer: Actor, resourceType: ResourceType, amount: number) {
    console.log('gatherer', gatherer, 'returned', amount, resourceType, 'to', this.actor);
    if(this.gathererMustEnter){ // todo!!!!!!
    }
    this.playerResourcesComponent.addResource(resourceType, amount);
    this.onResourcesReturned.next([resourceType, amount, gatherer]);
  }
  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getResourceTypes(): ResourceType[] {
    return this.resourceTypes;
  }
}
