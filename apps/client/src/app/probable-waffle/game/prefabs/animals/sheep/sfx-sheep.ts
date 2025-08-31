import { SoundDefinition } from "../../../entity/actor/components/audio-actor-component";
import { AudioSprites } from "../../../sfx/AudioSprites";

enum SheepSfx {
  SHEEP_BLEAT_1 = "sheep bleat 1",
  SHEEP_BLEAT_2 = "sheep bleat 2",
  SHEEP_BLEAT_3 = "sheep bleat 3",
  SHEEP_BLEAT_4 = "sheep bleat 4",
  SHEEP_SCISSORS = "sheep scissors",
  SHEEP_WOOL_BOMB = "sheep wool bomb"
}

export const ActorsSheepSfxBleatSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: SheepSfx.SHEEP_BLEAT_1 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: SheepSfx.SHEEP_BLEAT_2 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: SheepSfx.SHEEP_BLEAT_3 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: SheepSfx.SHEEP_BLEAT_4 }
];
export const ActorsSheepSfxScissorsSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: SheepSfx.SHEEP_SCISSORS }
];
export const ActorsSheepSfxWoolBombSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: SheepSfx.SHEEP_WOOL_BOMB }
];
