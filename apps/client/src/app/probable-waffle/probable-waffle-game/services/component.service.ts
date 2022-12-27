import { v4 as uuidv4 } from 'uuid';

export type Constructor<T extends Record<string, any> = object> = new (...args: any[]) => T;

export interface IComponent {
  init(gameObject: Phaser.GameObjects.GameObject): void;

  awake?: () => void;
  start?: () => void;
  update?: (time: number, delta: number) => void;
  destroy?: () => void;
}

export default class ComponentService {
  private readonly gameObject: Phaser.GameObjects.GameObject;

  constructor(gameObject: Phaser.GameObjects.GameObject) {
    this.gameObject = gameObject;
    // give our gameObjects a unique name
    if (!gameObject.name) {
      gameObject.name = uuidv4();
    }
  }

  private componentsByGameObject: Map<string, IComponent[]> = new Map(); // key is gameObject.name
  private queuedForStart: IComponent[] = [];

  addComponent<T extends IComponent>(component: T): T {
    // make sure we have a list of components for this gameObject
    if (!this.componentsByGameObject.has(this.gameObject.name)) {
      this.componentsByGameObject.set(this.gameObject.name, []);
    }

    // add new component to this list
    const list = this.componentsByGameObject.get(this.gameObject.name) as IComponent[];
    list.push(component);

    // call lifecycle hooks

    component.init(this.gameObject);

    if (component.awake) {
      component.awake();
    }

    if (component.start) {
      this.queuedForStart.push(component);
    }

    return component as T;
  }

  findComponent<T extends IComponent>(component: Constructor<T>): T {
    const components = this.componentsByGameObject.get(this.gameObject.name) as IComponent[];
    const comp = components.find((c) => c instanceof component);
    if(!comp) {
      throw new Error(`Component ${component.name} not found`);
    }
    return comp as T;
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
