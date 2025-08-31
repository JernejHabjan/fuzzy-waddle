import { SoundType } from "../../../entity/components/audio-actor-component";
import { ActorsHedgehogSfxAngrySounds, ActorsHedgehogSfxSelectionSounds } from "./sfx-hedgehog";
import { ANIM_HEDGEHOG_DEFINITION } from "./anims-hedgehog";

import type { PrefabDefinition } from "../../definitions/prefab-definition";

export const hedgehogDefinition = {
  components: {
    representable: {
      width: 32,
      height: 32
    },
    objectDescriptor: {
      color: 0x896347
    },
    translatable: {
      tileMoveDuration: 5000
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsHedgehogSfxSelectionSounds,
        [SoundType.SelectExtra]: ActorsHedgehogSfxAngrySounds
      }
    },
    animatable: { animations: ANIM_HEDGEHOG_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
