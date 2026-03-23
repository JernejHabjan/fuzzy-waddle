import { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ANIM_PUMPKIN_WARLOCK_PUMPKIN_DEFINITION } from "./anims-pumpkin-warlock-pumpkin";

export const pumpkinWarlockPumpkinDefinition = {
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
    animatable: { animations: ANIM_PUMPKIN_WARLOCK_PUMPKIN_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
