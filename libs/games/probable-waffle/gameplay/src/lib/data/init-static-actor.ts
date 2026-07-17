import { setActorData } from "./actor-data";
import { ColliderComponent } from "../entity/components/movement/collider-component";
import { ObjectDescriptorComponent } from "../entity/components/object-descriptor-component";
import type { ObjectDescriptorDefinition } from "../entity/components/object-descriptor-definition";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Initialises a simple static actor with an ObjectDescriptorComponent
 * and an optional ColliderComponent.
 *
 * Replaces the verbose inline setActorData + ObjectDescriptorComponent
 * pattern that was duplicated across many prefab files.
 */
export function initStaticActor(gameObject: GameObject, color: number | null, withCollider = false): void {
  const components: unknown[] = [
    new ObjectDescriptorComponent({ color } satisfies ObjectDescriptorDefinition)
  ];
  if (withCollider) {
    components.push(new ColliderComponent(gameObject));
  }
  setActorData(gameObject, components as any[], []);
}
