// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum TivaraWorkerFemaleSfx {
  ATTACK_1 = "Attack 1",
  ATTACK_2 = "Attack 2",
  ATTACK_3 = "Attack 3",
  BUILD_1 = "Build 1",
  BUILD_2 = "Build 2",
  CHOP_1 = "Chop 1",
  CHOP_2 = "Chop 2",
  DAMAGE_1 = "Damage 1",
  DAMAGE_2 = "Damage 2",
  DAMAGE_3 = "Damage 3",
  DAMAGE_4 = "Damage 4",
  DAMAGE_5 = "Damage 5",
  DAMAGE_6 = "Damage 6",
  ENTER_BUILDING_1_2 = "Enter building 1-2",
  ENTER_BUILDING_1 = "Enter building 1",
  LOCATION_UNAVAILABLE_1 = "Location unavailable 1",
  LOCATION_UNAVAILABLE_2 = "Location unavailable 2",
  MINE_1 = "Mine 1",
  MINE_2 = "Mine 2",
  MOVE_1 = "Move 1",
  MOVE_2 = "Move 2",
  MOVE_3 = "Move 3",
  MOVE_4 = "Move 4",
  REPAIR_1 = "Repair 1",
  REPAIR_2 = "Repair 2",
  SELECTION_1 = "Selection 1",
  SELECTION_2 = "Selection 2",
  SELECTION_3 = "Selection 3",
  SELECTION_4 = "Selection 4"
}

export const TivaraWorkerFemaleSfxAttackSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.ATTACK_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.ATTACK_2 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.ATTACK_3 }
];

export const TivaraWorkerFemaleSfxBuildSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.BUILD_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.BUILD_2 }
];

export const TivaraWorkerFemaleSfxChopSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.CHOP_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.CHOP_2 }
];

export const TivaraWorkerFemaleSfxDamageSounds: SoundDefinition[] = [
  // #366 - damage sound effects sound "wrong" during combat
  // { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.DAMAGE_1 },
  // { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.DAMAGE_2 },
  // { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.DAMAGE_3 }
];

export const TivaraWorkerFemaleSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.DAMAGE_4 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.DAMAGE_5 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.DAMAGE_6 }
];

export const TivaraWorkerFemaleSfxEnterSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.ENTER_BUILDING_1_2 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.ENTER_BUILDING_1 }
];

export const TivaraWorkerFemaleSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.LOCATION_UNAVAILABLE_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.LOCATION_UNAVAILABLE_2 }
];

export const TivaraWorkerFemaleSfxMineSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.MINE_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.MINE_2 }
];

export const TivaraWorkerFemaleSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.MOVE_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.MOVE_2 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.MOVE_3 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.MOVE_4 }
];

export const TivaraWorkerFemaleSfxRepairSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.REPAIR_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.REPAIR_2 }
];

export const TivaraWorkerFemaleSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.SELECTION_1 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.SELECTION_2 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.SELECTION_3 },
  { key: AudioSprites.TIVARA_WORKER_FEMALE, spriteName: TivaraWorkerFemaleSfx.SELECTION_4 }
];
