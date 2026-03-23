import { ANIM_FLYING_DEMON_RED_DEFINITION } from "./anims-flying_demon_red";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const flyingDemonRedDefinition = {
  components: {
    representable: {
      width: 48,
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
    animatable: { animations: ANIM_FLYING_DEMON_RED_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
