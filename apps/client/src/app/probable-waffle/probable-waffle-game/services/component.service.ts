export type Constructor<T extends Record<string, any> = object> = new (...args: any[]) => T;

export interface IComponent {
  init(): void;
  awake?: () => void;
  start?: () => void;
  update?: (time: number, delta: number) => void;
  destroy?: () => void;
}

export default class ComponentService {
  constructor(private gameObjectName: string) {}

  private componentsByGameObject: Map<string, IComponent[]> = new Map(); // key is gameObjectName
  private queuedForStart: IComponent[] = [];

  addComponent<T extends IComponent>(component: T): T {
    // make sure we have a list of components for this gameObject
    if (!this.componentsByGameObject.has(this.gameObjectName)) {
      this.componentsByGameObject.set(this.gameObjectName, []);
    }

    // add new component to this list
    const list = this.componentsByGameObject.get(this.gameObjectName) as IComponent[];
    list.push(component);

    // call lifecycle hooks

    component.init();

    if (component.awake) {
      component.awake();
    }

    if (component.start) {
      this.queuedForStart.push(component);
    }

    return component as T;
  }

  findComponent<T extends IComponent>(component: Constructor<T>): T {
    const components = this.componentsByGameObject.get(this.gameObjectName) as IComponent[];
    const comp = components.find((c) => c instanceof component);
    if (!comp) {
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
