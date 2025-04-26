// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum ActorsAnimalsSfx {
  HEDGEHOG_ANGRY = "hedgehog angry",
  HEDGEHOG_SELECTION_1 = "hedgehog selection 1",
  HEDGEHOG_SELECTION_2 = "hedgehog selection 2",
  SHEEP_BLEAT_1 = "sheep bleat 1",
  SHEEP_BLEAT_2 = "sheep bleat 2",
  SHEEP_BLEAT_3 = "sheep bleat 3",
  SHEEP_BLEAT_4 = "sheep bleat 4",
  SHEEP_SCISSORS = "sheep scissors",
  SHEEP_WOOL_BOMB = "sheep wool bomb"
}

export const ActorsSheepSfxBleatSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.SHEEP_BLEAT_1 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.SHEEP_BLEAT_2 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.SHEEP_BLEAT_3 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.SHEEP_BLEAT_4 }
];
export const ActorsSheepSfxScissorsSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.SHEEP_SCISSORS }
];
export const ActorsSheepSfxWoolBombSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.SHEEP_WOOL_BOMB }
];
export const ActorsHedgehogSfxAngrySounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.HEDGEHOG_ANGRY }
];
export const ActorsHedgehogSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.HEDGEHOG_SELECTION_1 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: ActorsAnimalsSfx.HEDGEHOG_SELECTION_2 }
];
