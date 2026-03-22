import { ANIM_MUSHROOM_WARRIOR_DEFINITION } from "./anims-mushroom_warrior";
import { PrefabDefinition } from "../../../definitions/prefab-definition";

export const mushroomWarriorDefinition = {
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
    animatable: { animations: ANIM_MUSHROOM_WARRIOR_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
