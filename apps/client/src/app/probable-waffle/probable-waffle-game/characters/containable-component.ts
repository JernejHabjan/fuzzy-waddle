import { Actor } from '../actor';
import { ContainerComponent } from '../buildings/container-component';

/**
 * Apply on actor that can be loaded into a container - for example enter a mine to gather resources or enter a tower to repair or shoot
 */
export class ContainableComponent {
  private containerOwner: Actor | null = null;
  constructor(public owner: Actor) {}

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
    if (!containerComponent) {
      throw new Error('Container owner has no container component');
    }
    containerComponent.unloadActor(this.owner);
  }
}
