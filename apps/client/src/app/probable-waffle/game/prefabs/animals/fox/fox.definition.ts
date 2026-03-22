import { ANIM_FOX_DEFINITION } from "./anims-fox";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const foxDefinition = {
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
    animatable: { animations: ANIM_FOX_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
