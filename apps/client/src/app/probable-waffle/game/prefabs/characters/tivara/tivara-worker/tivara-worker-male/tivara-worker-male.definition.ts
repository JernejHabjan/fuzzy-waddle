import {
  TivaraWorkerMaleSfxAttackSounds,
  TivaraWorkerMaleSfxBuildSounds,
  TivaraWorkerMaleSfxChopSounds,
  TivaraWorkerMaleSfxDamageSounds,
  TivaraWorkerMaleSfxDeathSounds,
  TivaraWorkerMaleSfxEnterSounds,
  TivaraWorkerMaleSfxLocationSounds,
  TivaraWorkerMaleSfxMineSounds,
  TivaraWorkerMaleSfxMoveSounds,
  TivaraWorkerMaleSfxRepairSounds,
  TivaraWorkerMaleSfxSelectionExtraSounds,
  TivaraWorkerMaleSfxSelectionSounds
} from "./TivaraWorkerMaleSfx";
import { tivaraWorkerDefinition } from "../tivara-worker.definition";
import { SoundType } from "../../../../../entity/actor/components/audio-actor-component";
import { ANIM_TIVARA_WORKER_MALE_DEFINITION } from "./tivara_worker_male_anims";
import type { PrefabDefinition } from "../../../../../data/prefab-definition";

export const tivaraWorkerMaleDefinition = {
  ...tivaraWorkerDefinition,
  components: {
    ...tivaraWorkerDefinition.components,
    info: {
      name: "Sandward",
      description: "From ruin to rise again — their toil feeds the endless rhythm etched in stone and soul",
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/worker_male.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    audio: {
      sounds: {
        [SoundType.Attack]: TivaraWorkerMaleSfxAttackSounds,
        [SoundType.Damage]: TivaraWorkerMaleSfxDamageSounds,
        [SoundType.Death]: TivaraWorkerMaleSfxDeathSounds,
        [SoundType.Select]: TivaraWorkerMaleSfxSelectionSounds,
        [SoundType.SelectExtra]: TivaraWorkerMaleSfxSelectionExtraSounds,
        [SoundType.Move]: TivaraWorkerMaleSfxMoveSounds,
        [SoundType.EnterContainer]: TivaraWorkerMaleSfxEnterSounds,
        [SoundType.LocationUnavailable]: TivaraWorkerMaleSfxLocationSounds,
        [SoundType.Repair]: TivaraWorkerMaleSfxRepairSounds,
        [SoundType.Heal]: TivaraWorkerMaleSfxRepairSounds,
        [SoundType.Build]: TivaraWorkerMaleSfxBuildSounds,
        [SoundType.Chop]: TivaraWorkerMaleSfxChopSounds,
        [SoundType.Mine]: TivaraWorkerMaleSfxMineSounds
      }
    },
    animatable: { animations: ANIM_TIVARA_WORKER_MALE_DEFINITION }
  }
} satisfies PrefabDefinition;
