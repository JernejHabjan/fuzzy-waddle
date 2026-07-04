import { ANIM_FIRE_SLIME_DEFINITION } from "./anims-fire_slime";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const fireSlimeDefinition = {
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
    animatable: { animations: ANIM_FIRE_SLIME_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
