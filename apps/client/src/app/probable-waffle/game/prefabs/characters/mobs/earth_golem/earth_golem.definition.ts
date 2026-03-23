import { ANIM_EARTH_GOLEM_DEFINITION } from "./anims-earth_golem";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const earthGolemDefinition = {
  components: {
    representable: {
      width: 128,
      height: 112,
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
    animatable: { animations: ANIM_EARTH_GOLEM_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
