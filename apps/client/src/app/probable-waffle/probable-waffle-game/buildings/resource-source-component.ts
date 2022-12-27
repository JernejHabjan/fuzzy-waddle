import { Pawn } from '../characters/pawn';
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

  extractResources(gatherer: Pawn, amount: number) {
    // todo
  }
  canGathererEnter(gatherer: Pawn) {}
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
