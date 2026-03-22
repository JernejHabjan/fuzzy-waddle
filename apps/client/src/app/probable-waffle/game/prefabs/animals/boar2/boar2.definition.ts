import type { PrefabDefinition } from "../../definitions/prefab-definition";
import { ANIM_BOAR2_DEFINITION } from "./anims-boar2";

export const boar2Definition = {
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
    animatable: { animations: ANIM_BOAR2_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
