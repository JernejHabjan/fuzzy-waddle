import { IComponent } from '../../../core/component.service';
import { ResourceType } from './resource-type';
import { Actor } from '../../actor/actor';
import { ContainerComponent } from '../../building/container-component';
import { Subject } from 'rxjs';

export interface ResourceSource {
  resourceSourceComponent: ResourceSourceComponent;
}

export class ResourceSourceComponent implements IComponent {
  private currentResources: number;
  private containerComponent: ContainerComponent | null = null;
  private gathererMustEnter = false;
  private gathererCapacity = 0;

  onResourcesChanged: Subject<[ResourceType, number, Actor]> = new Subject<[ResourceType, number, Actor]>();
  onDepleted: Subject<Actor> = new Subject<Actor>();

  constructor(
    private readonly actor: Actor,
    private resourceType: ResourceType,
    private maximumResources: number,
    private gatheringFactor: number
  ) {
    this.currentResources = this.maximumResources;
  }

  init(): void {
    this.containerComponent = this.actor.components.findComponentOrNull(ContainerComponent);
    this.gathererCapacity = this.containerComponent?.capacity ?? 0;
    this.gathererMustEnter = !!this.containerComponent;
  }

  extractResources(gatherer: Actor, amount: number): number {
    if (this.gathererMustEnter) {
      // todo!!!!!!
    }

    const gatheredAmount = Math.min(amount * this.gatheringFactor, this.currentResources);

    // deduct resources
    const oldResources = this.currentResources;
    this.currentResources -= gatheredAmount;
    const newResources = this.currentResources;

    console.log(
      'gatherer',
      gatherer,
      'extracted',
      gatheredAmount,
      this.resourceType,
      'from',
      this.actor,
      'oldResources',
      oldResources,
      'newResources',
      newResources
    );

    this.onResourcesChanged.next([this.resourceType, gatheredAmount, gatherer]);
    // check if we're depleted
    if (this.currentResources <= 0) {
      this.onDepleted.next(this.actor);
      this.actor.destroy();
    }
    return gatheredAmount;
  }

  canGathererEnter(gatherer: Actor): boolean {
    return this.containerComponent?.canLoadActor(gatherer) ?? true;
  }

  getResourceType(): ResourceType {
    return this.resourceType;
  }

  getMaximumResources(): number {
    return this.maximumResources;
  }

  getGatheringFactor(): number {
    return this.gatheringFactor;
  }

  mustGathererEnter(): boolean {
    return this.gathererMustEnter;
  }

  getCurrentResources(): number {
    return this.currentResources;
  }
}
