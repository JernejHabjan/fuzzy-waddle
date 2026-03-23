import { ANIM_SNOW_WENDIGO_DEFINITION } from "./anims-snow_wendigo";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const snowWendigoDefinition = {
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
    animatable: { animations: ANIM_SNOW_WENDIGO_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
