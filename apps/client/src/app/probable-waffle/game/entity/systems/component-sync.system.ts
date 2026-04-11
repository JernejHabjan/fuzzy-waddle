import type { SyncOptions } from "./sync.options";
import { createComponentProxy } from "./create-component.proxy";

/**
 * Wraps a component data object in a proxy so that property assignments:
 *   1. fire the matching EventEmitter (for local UI)
 *   2. run any registered hook (e.g. kill actor when health reaches 0)
 *
 * Network synchronisation is intentionally absent here.
 * In the deterministic lockstep model every client runs the same simulation,
 * so derived state (health, armor, …) must never be broadcast as pushed deltas.
 * This class is preserved so that Step 9 (desync hashing) can extend it to
 * collect periodic state snapshots without touching every call-site.
 */
export class ComponentSyncSystem {
  private readonly DEBUG = false;

  syncComponent<T extends object>(
    gameObject: Phaser.GameObjects.GameObject,
    componentData: T,
    options: SyncOptions<T>
  ): T {
    // Proxy intercepts writes → emits EventEmitters + runs hooks (local only)
    const proxiedData = createComponentProxy(componentData, {
      eventEmitters: options.eventEmitters,
      onPropertyChange: (property, value, previousValue) => {
        const hook = options.hooks?.[property];
        if (hook) {
          hook(value, previousValue);
        }

        if (this.DEBUG && value !== previousValue) {
          console.log(`[ComponentSyncSystem] ${gameObject.name}: ${property as string} ${previousValue} → ${value}`);
        }
      }
    });

    return proxiedData;
  }
}
