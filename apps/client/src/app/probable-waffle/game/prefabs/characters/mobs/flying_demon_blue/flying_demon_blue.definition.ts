import { ANIM_FLYING_DEMON_BLUE_DEFINITION } from "./anims-flying_demon_blue";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const flyingDemonBlueDefinition = {
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
    animatable: { animations: ANIM_FLYING_DEMON_BLUE_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
