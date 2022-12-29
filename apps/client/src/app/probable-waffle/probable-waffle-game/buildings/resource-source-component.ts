import { RepresentableActor } from '../characters/representable-actor';
import { IComponent } from '../services/component.service';
import { ResourceType } from './resource-type';
import { Actor } from '../actor';

export class ResourceSourceComponent implements IComponent {
  private readonly currentResources: number;
  constructor(
    private readonly actor: Actor,
    private resourceType: ResourceType,
    private maximumResources: number,
    private gatheringFactor: number,
    private gathererMustEnter: boolean,
    private gathererCapacity: boolean
  ) {
    this.currentResources = this.maximumResources;
  }

  extractResources(gatherer: RepresentableActor, amount: number) {
    // todo
  }
  canGathererEnter(gatherer: RepresentableActor) {}
  getResourceType(): ResourceType {
    return this.resourceType;
  }
  getMaximumResources(): number {
    // todo
    return 0;
  }
  getGatheringFactor(): number {
    // todo
    return 0;
  }
  MustGathererEnter(): boolean {
    // todo
    return false;
  }
  GetCurrentResources(): number {
    // todo
    return 0;
  }

  init(): void {
    // pass
  }
}
