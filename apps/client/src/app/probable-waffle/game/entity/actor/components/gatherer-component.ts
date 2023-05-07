import { IComponent } from '../../../core/component.service';
import { GatherData } from '../../economy/gather-data';
import { Actor } from '../actor';
import { ResourceType } from '../../economy/resource/resource-type';
import { ResourceSourceComponent } from '../../economy/resource/resource-source-component';
import { Mine } from '../../assets/buildings/mine';
import { GameplayLibrary } from '../../../library/gameplay-library';
import { Subject } from 'rxjs';
import { PlayerController } from '../../../world/managers/controllers/player-controller';
import { PlayerResourcesComponent } from '../../../world/managers/controllers/player-resources-component';
import { ContainerComponent } from '../../building/container-component';
import { ResourceDrainComponent } from '../../economy/resource/resource-drain-component';
import { OwnerComponent } from './owner-component';

export type GathererClasses = typeof Mine;

export class GathererComponent implements IComponent {
  gatheredResources: GatherData[] = [];
  // amount the actor is carrying
  carriedResourceAmount = 0;
  carriedResourceType: ResourceType | null = null;
  currentResourceSource: Actor | null = null;
  previousResourceSource: Actor | null = null;
  previousResourceType: ResourceType | null = null;
  remainingCooldown = 0;

  onResourceGathered: Subject<[Actor, Actor, GatherData, number]> = new Subject<[Actor, Actor, GatherData, number]>();
  onResourcesReturned: Subject<[Actor, ResourceType, number]> = new Subject<[Actor, ResourceType, number]>();

  constructor(
    private readonly actor: Actor,
    // type of actors the gatherer can gather resources from
    public resourceSourceActorClasses: GathererClasses[],
    // radius in which actor will automatically gather resourcesFrom
    public resourceSweepRadius: number
  ) {}

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

  /**
   * this gets set by the behavior tree
   */
  startGatheringResources(resourceSource: Actor) {
    if (!this.canGatherFrom(resourceSource)) {
      return;
    }
    if (this.currentResourceSource === resourceSource) {
      return;
    }

    this.currentResourceSource = resourceSource;

    const resourceSourceComponent = resourceSource.components.findComponentOrNull(ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return;
    }

    const gatherData = this.getGatherDataForResourceSource(resourceSource);

    if (!gatherData) {
      return;
    }

    // reset carried amount
    this.setCarriedResourceAmount(0);
    this.carriedResourceType = resourceSourceComponent.getResourceType();

    // start cooldown before first gathering
    this.remainingCooldown = gatherData.cooldown;

    if (resourceSourceComponent.mustGathererEnter()) {
      // enter resource source
      const containerComponent = resourceSource.components.findComponentOrNull(ContainerComponent);
      if (containerComponent) {
        containerComponent.loadActor(this.actor);
      }
    }
  }

  findClosestResourceDrain(): Actor | null {
    if (this.carriedResourceType === null) {
      throw new Error('Gatherer is not carrying any resources');
    }

    // find nearby actors
    let closestResourceDrain: Actor | null = null;
    let closestResourceDrainDistance = 0;

    const gatherer = this.actor;
    const gatherOwnerComponent = gatherer.components.findComponent(OwnerComponent);

    const actors: Actor[] = []; // todo get all actors in the world
    for (const resourceDrain of actors) {
      // check if found resource drain
      const resourceDrainComponent = resourceDrain.components.findComponentOrNull(ResourceDrainComponent);
      if (!resourceDrainComponent) {
        continue;
      }

      // check owner
      if (!gatherOwnerComponent.isSameTeamAsActor(resourceDrain)) {
        continue;
      }

      // check resource type
      if (!resourceDrainComponent.getResourceTypes().includes(this.carriedResourceType)) {
        continue;
      }

      // check if ready to use - e.g. building finished
      if (!GameplayLibrary.isReadyToUse(resourceDrain)) {
        continue;
      }

      // check distance
      const distance = GameplayLibrary.getDistanceBetweenActors(gatherer, resourceDrain);
      if (distance && (!closestResourceDrain || distance < closestResourceDrainDistance)) {
        closestResourceDrain = resourceDrain;
        closestResourceDrainDistance = distance;
      }
    }

    return closestResourceDrain;
  }

  // Gets the resource source the actor has recently been gathering from, if available, or a similar one within its sweep radius
  getPreferredResourceSource(): Actor | null {
    if (this.previousResourceSource) {
      return this.previousResourceSource;
    }
    return this.getClosestResourceSource(this.previousResourceType, this.resourceSweepRadius);
  }

  getClosestResourceSource(resourceType: ResourceType | null, maxDistance: number): Actor | null {
    let closestResourceSource: Actor | null = null;
    let closestResourceSourceDistance = 0;

    // todo get all actors in the world and check the closest
    const actors: Actor[] = [];
    for (const actor of actors) {
      // get resourceSourceComponent
      const resourceSourceComponent = actor.components.findComponentOrNull(ResourceSourceComponent);
      if (!resourceSourceComponent) {
        continue;
      }
      // if not correct resource type
      if (resourceType && resourceSourceComponent.getResourceType() !== resourceType) {
        continue;
      }
      // check distance
      const distance = GameplayLibrary.getDistanceBetweenActors(this.actor, actor);
      if (distance === null) {
        continue;
      }
      if (maxDistance > 0 && distance > maxDistance) {
        continue;
      }
      if (!closestResourceSource || distance < closestResourceSourceDistance) {
        closestResourceSource = actor;
        closestResourceSourceDistance = distance;
      }
    }
    return closestResourceSource;
  }

  isCarryingResources(): boolean {
    return !!this.carriedResourceAmount;
  }

  isGathering(): boolean {
    return !!this.currentResourceSource;
  }

  gatherResources(resourceSource: Actor): number {
    if (this.remainingCooldown > 0) {
      return 0;
    }
    if (!this.carriedResourceType) {
      throw new Error('Gatherer is not carrying any resources');
    }

    // check resource type
    const gatherData = this.getGatherDataForResourceSource(resourceSource);
    if (!gatherData) {
      return 0;
    }

    // determine amount to gather
    let amountToGather = gatherData.amountPerGathering;
    if (this.carriedResourceAmount + amountToGather > gatherData.capacity) {
      amountToGather = gatherData.capacity - this.carriedResourceAmount;
    }

    // gather resources
    const resourceSourceComponent = resourceSource.components.findComponentOrNull(ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return 0;
    }
    const gatheredAmount = resourceSourceComponent.extractResources(this.actor, amountToGather);
    this.setCarriedResourceAmount(this.carriedResourceAmount + gatheredAmount);
    // start cooldown timer
    this.remainingCooldown = gatherData.cooldown;

    console.log(`Gathered ${gatheredAmount} ${gatherData.resourceType} from ${resourceSource.name}`);

    this.onResourceGathered.next([this.actor, resourceSource, gatherData, gatheredAmount]);

    if (gatherData.needsReturnToDrain) {
      // check if we're at capacity
      if (this.carriedResourceAmount >= gatherData.capacity) {
        this.leaveCurrentResourceSource();
      }
    } else {
      // check if we're at capacity or the resource source is empty
      if (this.carriedResourceAmount >= gatherData.capacity || resourceSourceComponent.getCurrentResources() === 0) {
        // return immediately
        const playerController = this.actor.components.findComponentOrNull(PlayerController);
        if (playerController) {
          const playerResourcesComponent = playerController.components.findComponent(PlayerResourcesComponent);
          const returnedResources = playerResourcesComponent.addResource(
            this.carriedResourceType,
            this.carriedResourceAmount
          );
          if (returnedResources > 0) {
            this.setCarriedResourceAmount(this.carriedResourceAmount - returnedResources);

            console.log(`Returned ${returnedResources} ${this.carriedResourceType} to ${this.actor.name}`);

            this.onResourcesReturned.next([this.actor, this.carriedResourceType, returnedResources]);
          }
        }
      }

      // stop gathering
      this.leaveCurrentResourceSource();
    }
    return gatheredAmount;
  }

  returnResources(resourceDrain: Actor): number {
    if (!this.carriedResourceType) {
      throw new Error('Gatherer is not carrying any resources');
    }
    // return resources
    const resourceDrainComponent = resourceDrain.components.findComponent(ResourceDrainComponent);
    const returnedResources = resourceDrainComponent.returnResources(
      this.actor,
      this.carriedResourceType,
      this.carriedResourceAmount
    );
    this.setCarriedResourceAmount(this.carriedResourceAmount - returnedResources);

    console.log(`Returned ${returnedResources} ${this.carriedResourceType} to ${resourceDrain.name}`);
    // notify listeners
    this.onResourcesReturned.next([this.actor, this.carriedResourceType, returnedResources]);
    return returnedResources;
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

  getGatherRange(resourceSource: Actor): number {
    const gatherData = this.getGatherDataForResourceSource(resourceSource);

    if (!gatherData) {
      return 0;
    }
    return gatherData.range;
  }

  private getGatherDataForResourceType(carriedResourceType: ResourceType): GatherData | null {
    return this.gatheredResources.find((gatherData) => gatherData.resourceType === carriedResourceType) ?? null;
  }

  private getGatherDataForResourceSource(resourceSource: Actor): GatherData | null {
    const resourceSourceComponent = resourceSource.components.findComponentOrNull(ResourceSourceComponent);
    if (!resourceSourceComponent) {
      return null;
    }
    return this.getGatherDataForResourceType(resourceSourceComponent.getResourceType());
  }

  private setCarriedResourceAmount(amount: number) {
    this.carriedResourceAmount = amount;
    if (amount <= 0) {
      this.carriedResourceType = null;
    }
    // todo maybe add gameplay tags here
  }

  private leaveCurrentResourceSource() {
    const containerComponent = this.currentResourceSource?.components.findComponentOrNull(ContainerComponent);
    if (containerComponent) {
      containerComponent.unloadActor(this.actor);
    }

    // store data about resource source for future reference (e.g. return here, or find similar)
    this.previousResourceSource = this.currentResourceSource;
    this.previousResourceType = this.carriedResourceType;
    this.currentResourceSource = null;
  }
}
