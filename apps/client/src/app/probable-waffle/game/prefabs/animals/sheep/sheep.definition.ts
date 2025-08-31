import { SoundType } from "../../../entity/actor/components/audio-actor-component";
import { ActorsSheepSfxBleatSounds, ActorsSheepSfxScissorsSounds, ActorsSheepSfxWoolBombSounds } from "./sfx-sheep";
import { ANIM_SHEEP_DEFINITION } from "./anims-sheep";
import { PrefabDefinition } from "../../../data/actor-definitions";

export const sheepDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64
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
