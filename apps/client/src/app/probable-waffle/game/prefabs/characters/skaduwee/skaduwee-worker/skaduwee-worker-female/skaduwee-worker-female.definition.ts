import { skaduweeWorkerDefinition } from "../skaduwee-worker.definition";
import { SoundType } from "../../../../../entity/actor/components/audio-actor-component";
import {
  SkaduweeWorkerFemaleSfxAttackSounds,
  SkaduweeWorkerFemaleSfxBuildSounds,
  SkaduweeWorkerFemaleSfxChopSounds,
  SkaduweeWorkerFemaleSfxDamageSounds,
  SkaduweeWorkerFemaleSfxDeathSounds,
  SkaduweeWorkerFemaleSfxEnterSounds,
  SkaduweeWorkerFemaleSfxLocationSounds,
  SkaduweeWorkerFemaleSfxMineSounds,
  SkaduweeWorkerFemaleSfxMoveSounds,
  SkaduweeWorkerFemaleSfxRepairSounds,
  SkaduweeWorkerFemaleSfxSelectSounds
} from "./SkaduweeWorkerFemaleSfx";
import { ANIM_SKADUWEE_WORKER_FEMALE_DEFINITION } from "./skaduwee_worker_female_anims";

import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const skaduweeWorkerFemaleDefinition = {
  ...skaduweeWorkerDefinition,
  components: {
    ...skaduweeWorkerDefinition.components,
    info: {
      name: "Shadehand",
      description: "With whispered effort, the foundations of shadow are laid",
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/worker_female.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    audio: {
      sounds: {
        [SoundType.Attack]: SkaduweeWorkerFemaleSfxAttackSounds,
        [SoundType.Damage]: SkaduweeWorkerFemaleSfxDamageSounds,
        [SoundType.Death]: SkaduweeWorkerFemaleSfxDeathSounds,
        [SoundType.Select]: SkaduweeWorkerFemaleSfxSelectSounds,
        [SoundType.Move]: SkaduweeWorkerFemaleSfxMoveSounds,
        [SoundType.EnterContainer]: SkaduweeWorkerFemaleSfxEnterSounds,
        [SoundType.LocationUnavailable]: SkaduweeWorkerFemaleSfxLocationSounds,
        [SoundType.Repair]: SkaduweeWorkerFemaleSfxRepairSounds,
        [SoundType.Heal]: SkaduweeWorkerFemaleSfxRepairSounds,
        [SoundType.Build]: SkaduweeWorkerFemaleSfxBuildSounds,
        [SoundType.Chop]: SkaduweeWorkerFemaleSfxChopSounds,
        [SoundType.Mine]: SkaduweeWorkerFemaleSfxMineSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_WORKER_FEMALE_DEFINITION }
  }
} satisfies PrefabDefinition;
