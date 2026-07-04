import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ANIM_PUMPKIN_WARLOCK_BAT_DEFINITION } from "./anims-pumpkin-warlock-bat";

export const pumpkinWarlockBatDefinition = {
  components: {
    representable: {
      width: 32,
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
    flying: {
      height: 32
    },
    animatable: { animations: ANIM_PUMPKIN_WARLOCK_BAT_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
