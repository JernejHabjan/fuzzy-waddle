// This file was generated from "convert-to-enums.js" script
import { type SoundDefinition } from "../../../../entity/components/audio-actor-component";
import { AudioSprites } from "../../../../sfx/AudioSprites";

export enum SkaduweeOwlSfx {
  CANNOT_REACH_LOCATION = "Cannot reach location",
  DAMAGE = "Damage",
  DEATH = "Death",
  FURBALL_FIRE = "furball fire",
  FURBALL_HIT_1 = "furball hit 1",
  FURBALL_HIT_2 = "furball hit 2",
  MOVE = "Move",
  SELECTION_1 = "Selection 1",
  SELECTION_2 = "Selection 2"
}

export const SkaduweeOwlSfxFurballFireSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.FURBALL_FIRE }
];

export const SkaduweeOwlSfxFurballHitSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.FURBALL_HIT_1 },
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.FURBALL_HIT_2 }
];

export const SkaduweeOwlSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.SELECTION_1 },
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.SELECTION_2 }
];

export const SkaduweeOwlSfxDamageSounds: SoundDefinition[] = [
  // #366 - damage sound effects sound "wrong" during combat
  // { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.DAMAGE }
];

export const SkaduweeOwlSfxDeathSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.DEATH }
];

export const SkaduweeOwlSfxMoveSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.MOVE }
];

export const SkaduweeOwlSfxLocationSounds: SoundDefinition[] = [
  { key: AudioSprites.SKADUWEE_OWL, spriteName: SkaduweeOwlSfx.CANNOT_REACH_LOCATION }
];
