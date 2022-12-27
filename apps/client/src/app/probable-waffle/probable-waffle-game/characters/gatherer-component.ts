import { IComponent } from '../services/component.service';
import { GatherData } from '../buildings/gather-data';
import { Actor } from '../actor';
import { ResourceType } from '../buildings/resource-type';
import { ResourceSourceComponent } from '../buildings/resource-source-component';

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
    public resourceSourceActorClasses: typeof Actor[],
    // radius in which actor will automatically gather resourcesFrom
    public resourceSweepRadius: number
  ) {}

  init(): void {
    // pass
  }

  canGatherFrom(actor: ResourceSourceComponent): boolean {
    // if not full or not correct tool
    if (this.carriedResourceAmount >= actor.getMaximumResources()) {
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
}
