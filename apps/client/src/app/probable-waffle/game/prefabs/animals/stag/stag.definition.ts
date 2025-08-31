import { ANIM_STAG_DEFINITION } from "./anims-stag";

import type { PrefabDefinition } from "../../../data/prefab-definition";

export const stagDefinition = {
  components: {
    representable: {
      width: 32,
      height: 41
    },
    objectDescriptor: {
      color: 0xc75841
    },
    translatable: {
      tileMoveDuration: 800
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_STAG_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
