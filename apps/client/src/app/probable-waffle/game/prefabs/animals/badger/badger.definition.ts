import { ANIM_BADGER_DEFINITION } from "./anims-badger";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const badgerDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.5801426545255413 }
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
