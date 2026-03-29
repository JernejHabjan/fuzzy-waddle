import { ActorsSheepSfxBleatSounds, ActorsSheepSfxScissorsSounds, ActorsSheepSfxWoolBombSounds } from "./sfx-sheep";
import { ANIM_SHEEP_DEFINITION } from "./anims-sheep";

import type { PrefabDefinition } from "../../definitions/prefab-definition";
import { SoundType } from "../../../entity/components/actor-audio/sound-type";

export const sheepDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.772219288835404 }
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    translatable: {
      tileMoveDuration: 5000
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsSheepSfxBleatSounds,
        ["scissors"]: ActorsSheepSfxScissorsSounds,
        ["wool"]: ActorsSheepSfxWoolBombSounds
      }
    },
    animatable: { animations: ANIM_SHEEP_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
