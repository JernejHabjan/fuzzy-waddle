import type { PrefabDefinition } from "../../../data/actor-definitions";
import { ANIM_BOAR_DEFINITION } from "./anims-boar";

export const boarDefinition = {
  components: {
    representable: {
      width: 46,
      height: 32
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
    animatable: { animations: ANIM_BOAR_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
