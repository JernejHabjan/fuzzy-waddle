// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum TivaraSlingshotSfx {
  ATTACK_1 = "Attack 1",
  ATTACK_2 = "Attack 2",
  ATTACK_3 = "Attack 3",
  DAMAGE_1 = "Damage 1",
  DAMAGE_2 = "Damage 2",
  DAMAGE_3 = "Damage 3",
  DAMAGE_4 = "Damage 4",
  DAMAGE_5 = "Damage 5",
  DAMAGE_6 = "Damage 6",
  ENTER_BUILDING_1 = "Enter building 1",
  ENTER_BUILDING_2 = "Enter building 2",
  LOCATION_UNAVAILABLE_1 = "Location unavailable 1",
  LOCATION_UNAVAILABLE_2 = "Location unavailable 2",
  MOVE_1 = "Move 1",
  MOVE_2 = "Move 2",
  MOVE_3 = "Move 3",
  MOVE_4 = "Move 4",
  SELECTION_1 = "Selection 1",
  SELECTION_2 = "Selection 2",
  SELECTION_3 = "Selection 3",
  SELECTION_4 = "Selection 4"
}

export const TivaraSlingshotSfxAttackSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.ATTACK_1 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.ATTACK_2 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.ATTACK_3 }
];

export const TivaraSlingshotSfxDamageSounds: SoundDefinition[] = [
  // #366 - damage sound effects sound "wrong" during combat
  // { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.DAMAGE_1 },
  // { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.DAMAGE_2 },
  // { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.DAMAGE_3 }
];

export const TivaraSlingshotSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.DAMAGE_4 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.DAMAGE_5 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.DAMAGE_6 }
];

export const TivaraSlingshotSfxEnterSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.ENTER_BUILDING_1 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.ENTER_BUILDING_2 }
];

export const TivaraSlingshotSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.LOCATION_UNAVAILABLE_1 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.LOCATION_UNAVAILABLE_2 }
];

export const TivaraSlingshotSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.MOVE_1 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.MOVE_2 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.MOVE_3 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.MOVE_4 }
];

export const TivaraSlingshotSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.SELECTION_1 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.SELECTION_2 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.SELECTION_3 },
  { key: AudioSprites.TIVARA_SLINGSHOT, spriteName: TivaraSlingshotSfx.SELECTION_4 }
];
