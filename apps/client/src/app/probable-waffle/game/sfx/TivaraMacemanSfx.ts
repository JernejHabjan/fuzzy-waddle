// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum TivaraMacemanSfx {
  ATTACK_1 = "Attack 1",
  ATTACK_2 = "Attack 2",
  ATTACK_3 = "Attack 3",
  DAMAGE_1 = "Damage 1",
  DAMAGE_2 = "Damage 2",
  DAMAGE_3 = "Damage 3",
  DEATH_1 = "Death 1",
  DEATH_2 = "Death 2",
  DEATH_3 = "Death 3",
  ENTER_BUILDING_1 = "Enter building 1",
  LOCATION_UNAVAILABLE_1 = "Location unavailable 1",
  LOCATION_UNAVAILABLE_2 = "Location unavailable 2",
  MOVE_1 = "Move 1",
  MOVE_2 = "Move 2",
  MOVE_3 = "Move 3",
  MOVE_4 = "Move 4",
  SELECTION_1 = "Selection 1",
  SELECTION_2 = "Selection 2",
  SELECTION_3 = "Selection 3"
}

export const TivaraMacemanSfxAttackSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.ATTACK_1},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.ATTACK_2},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.ATTACK_3}
];

export const TivaraMacemanSfxDamageSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.DAMAGE_1},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.DAMAGE_2},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.DAMAGE_3}
];

export const TivaraMacemanSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.DEATH_1},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.DEATH_2},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.DEATH_3}
];

export const TivaraMacemanSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.LOCATION_UNAVAILABLE_1},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.LOCATION_UNAVAILABLE_2}
];

export const TivaraMacemanSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.MOVE_1},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.MOVE_2},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.MOVE_3},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.MOVE_4}
];

export const TivaraMacemanSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.SELECTION_1},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.SELECTION_2},
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.SELECTION_3}
];

export const TivaraMacemanSfxEnterSounds: SoundDefinition[] = [
  { key: AudioSprites.TIVARA_MACEMAN, spriteName: TivaraMacemanSfx.ENTER_BUILDING_1}
];
