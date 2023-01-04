import { IComponent } from '../services/component.service';
import { GatherData } from '../buildings/gather-data';
import { Actor } from '../actor';
import { ResourceType } from '../buildings/resource-type';
import { ResourceSourceComponent } from '../buildings/resource-source-component';
import { Mine } from '../economy/mine';

export type GathererClasses = typeof Mine;

export interface Gatherer {
  gathererComponent: GathererComponent;
}

export class GathererComponent implements IComponent {
  gatheredResources: GatherData[] = [];
  // amount the actor is carrying
  carriedResourceAmount = 0;
  carriedResourceType: ResourceType | null = null;
  currentResourceSource: Actor | null = null;
  previousResourceSource: Actor | null = null;
  remainingCooldown = 0;

  constructor(
    private readonly actor: Actor,
    // type of actors the gatherer can gather resources from
    public resourceSourceActorClasses: GathererClasses[],
    // radius in which actor will automatically gather resourcesFrom
    public resourceSweepRadius: number
  ) {
  }

  init(): void {
    // pass
  }

  canGatherFrom(actor: Actor): boolean {
    // get resourceSourceComponent from actor
    const resourceSourceComponent = actor.components.findComponentOrNull(ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return false;
    }
    // if not full or not correct tool
    if (this.carriedResourceAmount >= resourceSourceComponent.getMaximumResources()) {
      return false;
    }
    // todo

    return true;
  }

  // this gets set by the behavior tree
  startGatheringResources(actor: Actor) {
    // pass
  }

  findClosestResourceDrain(): Actor | null {
    // todo
    return null;
  }

  // Gets the resource source the actor has recently been gathering from, if available, or a similar one within its sweep radius
  getPreferredResourceSource(): Actor | null {
    // todo
    return null;
  }

  isCarryingResources(): boolean {
    return !!this.carriedResourceAmount;
  }

  isGathering(): boolean {
    return !!this.currentResourceSource;
  }

  gatherResources(resourceSource: Actor) {
    // todo
  }

  returnResourcesToDrain() {
    // todo
  }

  isCapacityFull() {
    if (!this.carriedResourceType) {
      return false;
    }

    const gatherData = this.getGatherDataForResourceType(this.carriedResourceType);
    if (!gatherData) {
      return false;
    }

    return this.carriedResourceAmount >= gatherData.capacity;

  }

  private getGatherDataForResourceType(carriedResourceType: ResourceType): GatherData | null {
    return this.gatheredResources.find(gatherData => gatherData.resourceType === carriedResourceType) ?? null;
  }
}
