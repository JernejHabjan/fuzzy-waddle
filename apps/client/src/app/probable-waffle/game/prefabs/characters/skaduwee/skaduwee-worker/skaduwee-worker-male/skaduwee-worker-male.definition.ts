import { ANIM_SKADUWEE_WORKER_MALE_DEFINITION } from "./skaduwee_worker_male_anims";
import { skaduweeWorkerDefinition } from "../skaduwee-worker.definition";
import {
  SkaduweeWorkerMaleSfxAttackSounds,
  SkaduweeWorkerMaleSfxBuildSounds,
  SkaduweeWorkerMaleSfxChopSounds,
  SkaduweeWorkerMaleSfxDamageSounds,
  SkaduweeWorkerMaleSfxDeathSounds,
  SkaduweeWorkerMaleSfxEnterSounds,
  SkaduweeWorkerMaleSfxLocationSounds,
  SkaduweeWorkerMaleSfxMineSounds,
  SkaduweeWorkerMaleSfxMoveSounds,
  SkaduweeWorkerMaleSfxRepairSounds,
  SkaduweeWorkerMaleSfxSelectionSounds
} from "./SkaduweeWorkerMaleSfx";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";

export const skaduweeWorkerMaleDefinition = {
  ...skaduweeWorkerDefinition,
  components: {
    ...skaduweeWorkerDefinition.components,
    info: {
      name: "Darkwright",
      description: "A shadowbound worker, crafting the foundation of dark dominion",
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/worker_male.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    audio: {
      sounds: {
        [SoundType.Attack]: SkaduweeWorkerMaleSfxAttackSounds,
        [SoundType.Damage]: SkaduweeWorkerMaleSfxDamageSounds,
        [SoundType.Death]: SkaduweeWorkerMaleSfxDeathSounds,
        [SoundType.Select]: SkaduweeWorkerMaleSfxSelectionSounds,
        [SoundType.Move]: SkaduweeWorkerMaleSfxMoveSounds,
        [SoundType.EnterContainer]: SkaduweeWorkerMaleSfxEnterSounds,
        [SoundType.LocationUnavailable]: SkaduweeWorkerMaleSfxLocationSounds,
        [SoundType.Repair]: SkaduweeWorkerMaleSfxRepairSounds,
        [SoundType.Heal]: SkaduweeWorkerMaleSfxRepairSounds,
        [SoundType.Build]: SkaduweeWorkerMaleSfxBuildSounds,
        [SoundType.Chop]: SkaduweeWorkerMaleSfxChopSounds,
        [SoundType.Mine]: SkaduweeWorkerMaleSfxMineSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_WORKER_MALE_DEFINITION }
  }
} satisfies PrefabDefinition;
