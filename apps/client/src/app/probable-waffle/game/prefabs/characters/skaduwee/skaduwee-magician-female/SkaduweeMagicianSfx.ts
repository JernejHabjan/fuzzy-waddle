// This file was generated from "convert-to-enums.js" script
import { type SoundDefinition } from "../../../../entity/components/audio-actor-component";
import { AudioSprites } from "../../../../sfx/AudioSprites";

export enum SkaduweeMagicianSfx {
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

export const SkaduweeMagicianSfxAttackSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.ATTACK_1 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.ATTACK_2 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.ATTACK_3 }
];

export const SkaduweeMagicianSfxDamageSounds: SoundDefinition[] = [
  // #366 - damage sound effects sound "wrong" during combat
  // { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.DAMAGE_1 },
  // { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.DAMAGE_2 },
  // { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.DAMAGE_3 }
];

export const SkaduweeMagicianSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.DAMAGE_4 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.DAMAGE_5 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.DAMAGE_6 }
];

export const SkaduweeMagicianSfxEnterSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.ENTER_BUILDING_1 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.ENTER_BUILDING_2 }
];

export const SkaduweeMagicianSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.LOCATION_UNAVAILABLE_1 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.LOCATION_UNAVAILABLE_2 }
];

export const SkaduweeMagicianSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.MOVE_1 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.MOVE_2 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.MOVE_3 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.MOVE_4 }
];

export const SkaduweeMagicianSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.SELECTION_1 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.SELECTION_2 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.SELECTION_3 },
  { key: AudioSprites.SKADUWEE_MAGICIAN, spriteName: SkaduweeMagicianSfx.SELECTION_4 }
];
