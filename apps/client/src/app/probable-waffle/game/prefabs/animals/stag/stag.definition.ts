import { ANIM_STAG_DEFINITION } from "./anims-stag";

import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const stagDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.8122607482100719 }
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
