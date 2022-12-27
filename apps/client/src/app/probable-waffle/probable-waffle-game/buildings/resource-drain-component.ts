import { IComponent } from '../services/component.service';
import { Actor } from '../actor';
import { ResourceType } from './resource-type';

// this is to be applied to townHall where resources can be returned to
export class ResourceDrainComponent implements IComponent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.Sprite,
    // max gatherers at same time
    private gathererCapacity: number
  ) {}
  init(): void {
    // pass
  }
  returnResources(gatherer: Actor, resourceType: ResourceType, amount: number) {
    // todo
  }
  mustGathererEnter(): boolean {
    // todo
    return false;
  }

  getResourceTypes(): ResourceType[] {
    // todo
    return [];
  }
}
