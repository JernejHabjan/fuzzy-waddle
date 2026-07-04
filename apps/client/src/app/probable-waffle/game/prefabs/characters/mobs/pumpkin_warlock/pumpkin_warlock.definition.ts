import { ANIM_PUMPKIN_WARLOCK_DEFINITION } from "./anims-pumpkin_warlock";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const pumpkinWarlockDefinition = {
  components: {
    representable: {
      width: 64,
      height: 80,
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
    animatable: { animations: ANIM_PUMPKIN_WARLOCK_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
