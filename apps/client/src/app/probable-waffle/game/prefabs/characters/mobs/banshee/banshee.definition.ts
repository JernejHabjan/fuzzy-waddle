import { ANIM_BANSHEE_DEFINITION } from "./anims-banshee";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const bansheeDefinition = {
  components: {
    representable: {
      width: 80,
      height: 80,
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
    animatable: { animations: ANIM_BANSHEE_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
