import type { PrefabDefinition } from "../../definitions/prefab-definition";

/**
 * Defines the shark fin's visual footprint without enabling collision or gameplay systems. The authoritative
 * actor lifecycle still supplies an ID and actor-index registration when a scenario creates it.
 */
export const sharkDefinition = {
  components: {
    representable: {
      width: 16,
      height: 16,
      origin: { x: 0.5, y: 0.875 }
    },
    objectDescriptor: {
      color: 0x1e5d7a
    }
  }
} satisfies PrefabDefinition;
