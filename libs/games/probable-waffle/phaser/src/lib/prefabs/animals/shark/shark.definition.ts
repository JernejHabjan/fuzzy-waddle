import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

/** Water navigation uses the same movement system and terrain restrictions as boats. */
export const sharkDefinition = {
  components: {
    representable: {
      width: 16,
      height: 16,
      origin: { x: 0.5, y: 0.875 }
    },
    objectDescriptor: {
      color: 0x1e5d7a
    },
    translatable: { tileMoveDuration: 450, movementTerrainType: MovementTerrainType.Water }
  },
  systems: { movement: { enabled: true }, action: { enabled: true } }
} satisfies PrefabDefinition;
