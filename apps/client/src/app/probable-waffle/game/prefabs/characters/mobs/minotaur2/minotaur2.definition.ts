import { ANIM_MINOTAUR2_DEFINITION } from "./anims-minotaur2";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const minotaur2Definition = {
  components: {
    representable: {
      width: 144,
      height: 96,
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
    animatable: { animations: ANIM_MINOTAUR2_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
