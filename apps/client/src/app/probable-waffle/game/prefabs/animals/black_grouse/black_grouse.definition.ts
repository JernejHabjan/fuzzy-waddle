import { ANIM_BLACK_GROUSE_DEFINITION } from "./anims-black_grouse";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const blackGrouseDefinition = {
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
    animatable: { animations: ANIM_BLACK_GROUSE_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
