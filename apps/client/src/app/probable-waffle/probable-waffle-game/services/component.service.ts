import { v4 as uuidv4 } from 'uuid';

export type Constructor<T extends {} = {}> = new (...args: any[]) => T;

export interface IComponent {
  init(gameObject: Phaser.GameObjects.GameObject): void;

  awake?: () => void;
  start?: () => void;
  update?: (time: number, delta: number) => void;
  destroy?: () => void;
}

export default class ComponentService {

  private componentsByGameObject: Map<string, IComponent[]> = new Map(); // key is gameObject.name
  private queuedForStart: IComponent[] = [];

  addComponent<T extends IComponent>(gameObject: Phaser.GameObjects.GameObject, component: IComponent): T {
    // give our gameObjects a unique name
    if (!gameObject.name) {
      gameObject.name = uuidv4();
    }
    // make sure we have a list of components for this gameObject
    if (!this.componentsByGameObject.has(gameObject.name)) {
      this.componentsByGameObject.set(gameObject.name, []);
    }

    // add new component to this list
    const list = this.componentsByGameObject.get(gameObject.name) as IComponent[];
    list.push(component);

    // call lifecycle hooks

    component.init(gameObject);

    if (component.awake) {
      component.awake();
    }

    if (component.start) {
      this.queuedForStart.push(component);
    }

    return component as T;
  }

  findComponent<T extends IComponent>(gameObject: Phaser.GameObjects.GameObject, component: Constructor<T>): T | null {
    const components = this.componentsByGameObject.get(gameObject.name);
    if (!components) {
      return null;
    }

    return components.find(c => c instanceof component) as T;
  }


  update(time: number, delta: number) {
    while (this.queuedForStart.length) {
      const component = this.queuedForStart.shift();
      if (component?.start) {
        component.start();
      }
    }
    const entries = this.componentsByGameObject.entries();
    for (const [, value] of entries) {
      for (const component of value) {
        if (component.update) {
          component.update(time, delta);
        }
      }
    }
  }

  destroy() {
    const entries = this.componentsByGameObject.entries();
    for (const [, value] of entries) {
      for (const component of value) {
        if (component.destroy) {
          component.destroy();
        }
      }
    }
  }

}
