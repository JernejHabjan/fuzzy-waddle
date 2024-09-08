import { EventEmitter } from "@angular/core";
import { Subscription } from "rxjs";
import { listenToActorEvents, sendActorEvent } from "../../data/scene-data";

function createComponentProxy<T extends object>(
  target: T,
  options: {
    eventEmitters?: { [K in keyof T]?: EventEmitter<any> };
    onPropertyChange?: (property: keyof T, newValue: any, oldValue: any) => void;
  }
): T {
  return new Proxy(target, {
    set: (obj: T, prop: string | symbol, value: any) => {
      const property = prop as keyof T;
      const oldValue = obj[property];

      // Only proceed if the new value is different from the old value
      if (oldValue !== value) {
        // Update the property
        obj[property] = value;

        // If onPropertyChange is provided, call it
        if (options.onPropertyChange) {
          options.onPropertyChange(property, value, oldValue);
        }

        // Emit event if an event emitter is defined for this property
        if (options.eventEmitters && options.eventEmitters[property]) {
          options.eventEmitters[property]!.emit(value);
        }
      }

      // Indicate that the property update was successful
      return true;
    }
  });
}

function setNestedProperty(target: any, path: string[], value: any) {
  if (path.length === 1) {
    target[path[0]] = value;
  } else {
    if (!target[path[0]]) {
      target[path[0]] = {};
    }
    setNestedProperty(target[path[0]], path.slice(1), value);
  }
}

function getNestedValue(target: any, path: string[]): any {
  return path.reduce((obj, key) => obj && obj[key], target);
}

export type SyncOptions<T> = {
  eventPrefix: string;
  propertyMap: { [K in keyof T]: string };
  eventEmitters?: { [K in keyof T]?: EventEmitter<any> };
  hooks?: { [K in keyof T]?: (value: any, previousValue: any) => void };
  onDestroy?: () => void;
};

export class ComponentSyncSystem {
  private subscriptions: Subscription[] = [];

  /**
   * Syncs a component's properties with external events, allowing hooks and event emission.
   * @param gameObject The game object tied to the component.
   * @param componentData The data object of the component to be proxied and synced.
   * @param options Sync options including event prefix, property map, event emitters, and hooks.
   */
  syncComponent<T extends object>(
    gameObject: Phaser.GameObjects.GameObject,
    componentData: T,
    options: SyncOptions<T>
  ): T {
    // Create a proxy to handle property updates and event emission
    const proxiedData = createComponentProxy(componentData, {
      eventEmitters: options.eventEmitters,
      onPropertyChange: (property, value, previousValue) => {
        // Run custom hook if defined
        const hook = options.hooks?.[property];
        if (hook) {
          hook(value, previousValue);
        }

        // Only emit event if custom hook logic allows
        if (value !== previousValue) {
          // Construct the nested property path for actorDefinition
          const key = this.getKey(property, options);
          const actorDefinition: any = {};
          setNestedProperty(actorDefinition, key, value);

          sendActorEvent(gameObject, key.join("."), {
            actorDefinition
          });
        }
      }
    });

    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
      // Listen to external events and update the component's properties
      const subscription = listenToActorEvents(gameObject, options.eventPrefix)?.subscribe((payload) => {
        // Extract property from payload and update the proxiedData
        const property = Object.keys(options.propertyMap).find((key) =>
          payload.property.endsWith(options.propertyMap[key as keyof T])
        ) as keyof T;

        if (property) {
          const key = this.getKey(property, options);
          if (key.length) {
            const value = getNestedValue(payload.data.actorDefinition, key);
            if (value !== undefined) {
              setNestedProperty(proxiedData, [property as string], value);

              console.log(`Property ${property as string} updated to ${value} on ${gameObject.constructor.name}`);
            }
          }
        }
      });

      if (subscription) this.subscriptions.push(subscription);
    });

    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.cleanup, this);

    return proxiedData;
  }

  private getKey<T>(property: keyof T, options: SyncOptions<T>): string[] {
    const nestedPath = [options.eventPrefix];
    nestedPath.push(...(options.propertyMap[property]?.split(".") || []));
    return nestedPath;
  }

  /**
   * Cleans up any active subscriptions
   */
  private cleanup() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }
}
