import GameObject = Phaser.GameObjects.GameObject;
import { ActorData, ActorDataKey } from "./actor-data";

/**
 * Gets a component from an actor by its class constructor.
 * Optimized for performance - called frequently in hot paths (100+ calls per frame).
 *
 * Performance optimizations:
 * - Single getData call
 * - Early return pattern
 * - Inline type assertion
 * - No unnecessary intermediate variables
 *
 * @param actor - The game object to get the component from
 * @param componentClass - The component class constructor
 * @returns The component instance or undefined if not found
 */
export function getActorComponent<T>(actor: GameObject, componentClass: new (...args: any[]) => T): T | undefined {
  const actorData = actor.getData(ActorDataKey) as ActorData | undefined;
  return actorData?.components.get(componentClass);
}

/**
 * Checks if an actor has a specific component.
 * Faster than getActorComponent when you only need to check existence.
 *
 * @param actor - The game object to check
 * @param componentClass - The component class constructor
 * @returns true if the component exists, false otherwise
 */
export function hasActorComponent(actor: GameObject, componentClass: new (...args: any[]) => any): boolean {
  const actorData = actor.getData(ActorDataKey) as ActorData | undefined;
  return actorData?.components.has(componentClass) ?? false;
}

/**
 * Gets multiple components from an actor in one call.
 * More efficient than multiple getActorComponent calls.
 *
 * @param actor - The game object to get components from
 * @param componentClasses - Array of component class constructors
 * @returns Array of component instances (undefined for missing components)
 *
 * @example
 * const [health, attack] = getActorComponents(actor, [HealthComponent, AttackComponent]);
 */
export function getActorComponents<T extends any[]>(
  actor: GameObject,
  componentClasses: { [K in keyof T]: new (...args: any[]) => T[K] }
): { [K in keyof T]: T[K] | undefined } {
  const actorData = actor.getData(ActorDataKey) as ActorData | undefined;
  if (!actorData) {
    return componentClasses.map(() => undefined) as any;
  }
  return componentClasses.map(cls => actorData.components.get(cls)) as any;
}

