import { ANIM_CHICK_DEFINITION } from "./anims-chick";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const chickDefinition = {
  components: {
    representable: {
      width: 16,
      height: 16,
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
    animatable: { animations: ANIM_CHICK_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
