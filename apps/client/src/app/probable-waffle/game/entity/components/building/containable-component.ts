import { ContainerComponent } from "./container-component";
import { getActorComponent } from "../../../data/actor-component";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Apply on actor that can be loaded into a container - for example enter a mine to gather resources or enter a tower to repair or shoot
 */
export class ContainableComponent {
  private containerOwner: GameObject | null = null;

  constructor(public owner: GameObject) {}

  isContained() {
    return !!this.containerOwner;
  }

  leaveContainer() {
    if (!this.containerOwner) return;

    const containerComponent = getActorComponent(this.containerOwner, ContainerComponent);
    containerComponent?.unloadGameObject(this.owner);
  }

  setContainer(containerOwner: GameObject) {
    this.containerOwner = containerOwner;
  }

  /**
   * unload actor from container
   */
  onKilled() {
    if (!this.containerOwner) {
      return;
    }
    const containerComponent = getActorComponent(this.containerOwner, ContainerComponent);
    containerComponent?.unloadGameObject(this.owner);
  }
}
