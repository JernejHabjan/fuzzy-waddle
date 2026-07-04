import { ANIM_BULL_DEFINITION } from "./anims-bull";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const bullDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64,
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
    animatable: { animations: ANIM_BULL_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
