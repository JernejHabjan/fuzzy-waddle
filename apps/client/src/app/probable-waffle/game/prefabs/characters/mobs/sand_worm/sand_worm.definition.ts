import { ANIM_SAND_WORM_DEFINITION } from "./anims-sand_worm";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const sandWormDefinition = {
  components: {
    representable: {
      width: 48,
      height: 96,
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
    animatable: { animations: ANIM_SAND_WORM_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
