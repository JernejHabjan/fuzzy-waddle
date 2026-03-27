import { ANIM_FLOWER_MONSTER_DEFINITION } from "./anims-flower_monster";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const flowerMonsterDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.773612963520417 }
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
    animatable: { animations: ANIM_FLOWER_MONSTER_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
