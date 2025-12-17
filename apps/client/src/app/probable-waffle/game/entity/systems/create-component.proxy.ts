import { EventEmitter } from "@angular/core";

export function createComponentProxy<T extends object>(
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
