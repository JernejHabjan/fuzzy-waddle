export type Constructor<T extends Record<string, any> = object> = new (...args: any[]) => T;

export interface IComponent {
  init?: () => void;
  // on start, you can access other components
  start?: () => void;
  update?: (time: number, delta: number) => void;
  destroy?: () => void;
}

export class ComponentService {
  private componentsByGameObject: Map<string, IComponent[]> = new Map(); // key is gameObjectName

  constructor(private gameObjectName: string) {}

  addComponent<T extends IComponent>(component: T): T {
    // make sure we have a list of components for this gameObject
    if (!this.componentsByGameObject.has(this.gameObjectName)) {
      this.componentsByGameObject.set(this.gameObjectName, []);
    }

    // add new component to this list
    const list = this.componentsByGameObject.get(this.gameObjectName) as IComponent[];
    list.push(component);

    // call lifecycle hooks
    return component satisfies T;
  }

  init() {
    const entries = this.componentsByGameObject.entries();
    for (const [, value] of entries) {
      for (const component of value) {
        if (component.init) {
          component.init();
        }
      }
    }
  }

  start() {
    const entries = this.componentsByGameObject.entries();
    for (const [, value] of entries) {
      for (const component of value) {
        if (component.start) {
          component.start();
        }
      }
    }
  }

  findComponent<T extends IComponent>(component: Constructor<T>): T {
    const comp = this.findComponentOrNull(component);
    if (!comp) {
      throw new Error(`Component ${component.name} not found`);
    }
    return comp;
  }

  findComponentOrNull<T extends IComponent>(component: Constructor<T>): T | null {
    const components = this.componentsByGameObject.get(this.gameObjectName) as IComponent[];
    const comp = components.find((c) => c instanceof component);
    if (!comp) {
      return null;
    }
    return comp as T;
  }

  update(time: number, delta: number) {
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
