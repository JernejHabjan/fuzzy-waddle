import {
  TivaraWorkerFemaleSfxAttackSounds,
  TivaraWorkerFemaleSfxBuildSounds,
  TivaraWorkerFemaleSfxChopSounds,
  TivaraWorkerFemaleSfxDamageSounds,
  TivaraWorkerFemaleSfxDeathSounds,
  TivaraWorkerFemaleSfxEnterSounds,
  TivaraWorkerFemaleSfxLocationSounds,
  TivaraWorkerFemaleSfxMineSounds,
  TivaraWorkerFemaleSfxMoveSounds,
  TivaraWorkerFemaleSfxRepairSounds,
  TivaraWorkerFemaleSfxSelectionSounds
} from "../../../../../sfx/TivaraWorkerFemaleSfx";
import { tivaraWorkerDefinition } from "../tivara-worker.definition";
import { SoundType } from "../../../../../entity/actor/components/audio-actor-component";
import { ANIM_TIVARA_WORKER_FEMALE_DEFINITION } from "./tivara_worker_female_anims";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const tivaraWorkerFemaleDefinition = {
  ...tivaraWorkerDefinition,
  components: {
    ...tivaraWorkerDefinition.components,
    info: {
      name: "Dustbound",
      description: "Bound by ancient decree, they labor in the sand to honor what once was — and what must return",
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/worker_female.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    audio: {
      sounds: {
        [SoundType.Attack]: TivaraWorkerFemaleSfxAttackSounds,
        [SoundType.Damage]: TivaraWorkerFemaleSfxDamageSounds,
        [SoundType.Death]: TivaraWorkerFemaleSfxDeathSounds,
        [SoundType.Select]: TivaraWorkerFemaleSfxSelectionSounds,
        [SoundType.Move]: TivaraWorkerFemaleSfxMoveSounds,
        [SoundType.EnterContainer]: TivaraWorkerFemaleSfxEnterSounds,
        [SoundType.LocationUnavailable]: TivaraWorkerFemaleSfxLocationSounds,
        [SoundType.Repair]: TivaraWorkerFemaleSfxRepairSounds,
        [SoundType.Heal]: TivaraWorkerFemaleSfxRepairSounds,
        [SoundType.Build]: TivaraWorkerFemaleSfxBuildSounds,
        [SoundType.Chop]: TivaraWorkerFemaleSfxChopSounds,
        [SoundType.Mine]: TivaraWorkerFemaleSfxMineSounds
      }
    },
    animatable: { animations: ANIM_TIVARA_WORKER_FEMALE_DEFINITION }
  }
} satisfies PrefabDefinition;
