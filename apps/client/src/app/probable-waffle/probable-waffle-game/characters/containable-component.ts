import { Actor } from '../actor';
import { ContainerComponent } from '../buildings/container-component';
import { IComponent } from '../services/component.service';

export interface Containable {
  containableComponent: ContainableComponent;
}

/**
 * Apply on actor that can be loaded into a container - for example enter a mine to gather resources or enter a tower to repair or shoot
 */
export class ContainableComponent implements IComponent {
  private containerOwner: Actor | null = null;
  constructor(public owner: Actor) {}

  init() {
    // pass
  }

  setContainer(containerOwner: Actor) {
    this.containerOwner = containerOwner;
  }

  /**
   * unload actor from container
   */
  onKilled() {
    if (!this.containerOwner) {
      return;
    }
    const containerComponent = this.containerOwner.components.findComponent(ContainerComponent);
    containerComponent.unloadActor(this.owner);
  }
}
