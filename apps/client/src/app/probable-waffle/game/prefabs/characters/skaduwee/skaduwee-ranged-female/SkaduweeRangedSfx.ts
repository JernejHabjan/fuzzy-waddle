// This file was generated from "convert-to-enums.js" script
import { type SoundDefinition } from "../../../../entity/components/actor-audio/audio-actor-component";
import { AudioSprites } from "../../../../sfx/audio-sprites";

export enum SkaduweeRangedSfx {
  ATTACK_1 = "Attack 1",
  ATTACK_2 = "Attack 2",
  ATTACK_3 = "Attack 3",
  DAMAGE_1 = "Damage 1",
  DAMAGE_2 = "Damage 2",
  DAMAGE_3 = "Damage 3",
  DAMAGE_4 = "Damage 4",
  DAMAGE_5 = "Damage 5",
  DAMAGE_6 = "Damage 6",
  DAMAGE_7 = "Damage 7",
  DEATH_1 = "Death 1",
  DEATH_2 = "Death 2",
  DEATH_3 = "Death 3",
  DEATH_4 = "Death 4",
  DEATH_5 = "Death 5",
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

export const SkaduweeRangedSfxAttackSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.ATTACK_1 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.ATTACK_2 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.ATTACK_3 }
];

export const SkaduweeRangedSfxDamageSounds: SoundDefinition[] = [
  // #366 - damage sound effects sound "wrong" during combat
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_1 },
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_2 },
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_3 },
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_4 },
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_5 },
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_6 },
  // { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DAMAGE_7 }
];

export const SkaduweeRangedSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DEATH_1 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DEATH_2 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DEATH_3 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DEATH_4 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.DEATH_5 }
];

export const SkaduweeRangedSfxEnterSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.ENTER_BUILDING_1 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.ENTER_BUILDING_2 }
];

export const SkaduweeRangedSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.LOCATION_UNAVAILABLE_1 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.LOCATION_UNAVAILABLE_2 }
];

export const SkaduweeRangedSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.MOVE_1 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.MOVE_2 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.MOVE_3 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.MOVE_4 }
];

export const SkaduweeRangedSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.SELECTION_1 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.SELECTION_2 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.SELECTION_3 },
  { key: AudioSprites.SKADUWEE_RANGED, spriteName: SkaduweeRangedSfx.SELECTION_4 }
];
