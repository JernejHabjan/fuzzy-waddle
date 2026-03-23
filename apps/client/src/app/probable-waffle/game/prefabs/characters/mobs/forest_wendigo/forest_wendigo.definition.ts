import { ANIM_FOREST_WENDIGO_DEFINITION } from "./anims-forest_wendigo";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const forestWendigoDefinition = {
  components: {
    representable: {
      width: 64,
      height: 80,
      origin: { x: 0.5, y: 0.9 }
    },
    objectDescriptor: {
      color: 0x222e37
    },
    translatable: {
      tileMoveDuration: 400
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_FOREST_WENDIGO_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
