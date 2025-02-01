import GameObject = Phaser.GameObjects.GameObject;
import Phaser from "phaser";
import { HealthComponent } from "../combat/components/health-component";

export type ContainerDefinition = {
  capacity: number;
};

/**
 * apply to resource source that needs gameObjects to enter to gather
 */
export class ContainerComponent {
  static readonly GameObjectVisibilityChanged = "GameObjectVisibilityChanged";
  private containedGameObjects = new Set<GameObject>();

  constructor(
    private readonly gameObject: GameObject,
    public readonly containerDefinition: ContainerDefinition
  ) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.onKilled, this);
  }

  getContainedGameObjects(): GameObject[] {
    return Array.from(this.containedGameObjects);
  }

  onKilled() {
    this.unloadAll();
  }

  destroy() {
    this.onKilled();
  }

  unloadAll() {
    this.containedGameObjects.forEach((gameObject) => {
      this.unloadGameObject(gameObject);
    });
  }

  unloadGameObject(gameObject: GameObject) {
    this.containedGameObjects.delete(gameObject);
    this.setGameObjectVisible(gameObject, true);
  }

  canLoadGameObject(gameObject: GameObject): boolean {
    // check if gameObject is not already in container
    if (this.containedGameObjects.has(gameObject)) {
      return false;
    }
    return this.containedGameObjects.size < this.containerDefinition.capacity;
  }

  loadGameObject(gameObject: GameObject) {
    if (!this.canLoadGameObject(gameObject)) {
      return;
    }
    this.containedGameObjects.add(gameObject);
    this.setGameObjectVisible(gameObject, false);
  }

  setGameObjectVisible(gameObject: GameObject, visible: boolean) {
    const visibleComponent = gameObject as unknown as Phaser.GameObjects.Components.Visible; // todo this is used on multiple places
    if (visibleComponent.setVisible === undefined) return;
    visibleComponent.setVisible(visible);
    gameObject.emit(ContainerComponent.GameObjectVisibilityChanged, visible);
  }
}
