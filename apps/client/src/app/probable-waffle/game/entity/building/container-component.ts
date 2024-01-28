import GameObject = Phaser.GameObjects.GameObject;

// apply to resource source that needs gameObjects to enter to gather
export class ContainerComponent {
  private containedGameObjects = new Set<GameObject>();

  constructor(public readonly capacity: number) {}

  getContainedGameObjects(): GameObject[] {
    return Array.from(this.containedGameObjects);
  }

  onKilled() {
    this.unloadAll();
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
    return this.containedGameObjects.size < this.capacity;
  }

  loadGameObject(gameObject: GameObject) {
    if (!this.canLoadGameObject(gameObject)) {
      return;
    }
    this.containedGameObjects.add(gameObject);
    this.setGameObjectVisible(gameObject, false);
  }

  setGameObjectVisible(gameObject: GameObject, visible: boolean) {
    const visibleComponent = gameObject as any as Phaser.GameObjects.Components.Visible;
    if (visibleComponent.setVisible === undefined) return;
    visibleComponent.setVisible(visible);
  }
}
