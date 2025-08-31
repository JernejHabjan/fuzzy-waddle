// This file was generated from "convert-to-enums.js" script
import { type SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum SkaduweeWarriorSfx {
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
  ENTER_BUILDING_2 = "Enter building 2",
  LOCATION_UNAVAILABLE_1 = "Location unavailable 1",
  LOCATION_UNAVAILABLE_2 = "Location unavailable 2",
  MOVE_1 = "Move 1",
  MOVE_2 = "Move 2",
  MOVE_3 = "Move 3",
  MOVE_4 = "Move 4",
  SELECT_1 = "Select 1",
  SELECTION_2 = "Selection 2",
  SELECTION_3 = "Selection 3",
  SELECTION_4 = "Selection 4"
}

export const SkaduweeWarriorSfxAttackSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.ATTACK_1 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.ATTACK_2 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.ATTACK_3 }
];

export const SkaduweeWarriorSfxDamageSounds: SoundDefinition[] = [
  // #366 - damage sound effects sound "wrong" during combat
  // { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.DAMAGE_1 },
  // { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.DAMAGE_2 },
  // { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.DAMAGE_3 }
];

export const SkaduweeWarriorSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.DEATH_1 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.DEATH_2 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.DEATH_3 }
];

export const SkaduweeWarriorSfxEnterSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.ENTER_BUILDING_1 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.ENTER_BUILDING_2 }
];

export const SkaduweeWarriorSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.LOCATION_UNAVAILABLE_1 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.LOCATION_UNAVAILABLE_2 }
];

export const SkaduweeWarriorSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.MOVE_1 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.MOVE_2 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.MOVE_3 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.MOVE_4 }
];

export const SkaduweeWarriorSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECTION_2 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECTION_3 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECTION_4 }
];

export const SkaduweeWarriorSfxSelectSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECT_1 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECTION_2 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECTION_3 },
  { key: AudioSprites.SKADUWEE_WARRIOR, spriteName: SkaduweeWarriorSfx.SELECTION_4 }
];
