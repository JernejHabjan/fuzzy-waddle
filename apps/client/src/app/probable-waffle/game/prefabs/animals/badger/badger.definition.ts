import type { PrefabDefinition } from "../../../data/actor-definitions";
import { ANIM_BADGER_DEFINITION } from "./anims-badger";

export const badgerDefinition = {
  components: {
    representable: {
      width: 42,
      height: 32
    },
    objectDescriptor: {
      color: 0x222e37
    },
    translatable: {
      tileMoveDuration: 800
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_BADGER_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
