import { ANIM_BIG_WATER_SLIME_DEFINITION } from "./anims-big_water_slime";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const bigWaterSlimeDefinition = {
  components: {
    representable: {
      width: 32,
      height: 32,
      origin: { x: 0.5, y: 0.773612963520417 }
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
    animatable: { animations: ANIM_BIG_WATER_SLIME_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
