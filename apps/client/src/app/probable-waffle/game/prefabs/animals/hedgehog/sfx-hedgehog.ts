import { SoundDefinition } from "../../../entity/actor/components/audio-actor-component";
import { AudioSprites } from "../../../sfx/AudioSprites";

enum HedgehogSfx {
  HEDGEHOG_ANGRY = "hedgehog angry",
  HEDGEHOG_SELECTION_1 = "hedgehog selection 1",
  HEDGEHOG_SELECTION_2 = "hedgehog selection 2"
}

export const ActorsHedgehogSfxAngrySounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: HedgehogSfx.HEDGEHOG_ANGRY }
];
export const ActorsHedgehogSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: HedgehogSfx.HEDGEHOG_SELECTION_1 },
  { key: AudioSprites.ACTORS_ANIMALS, spriteName: HedgehogSfx.HEDGEHOG_SELECTION_2 }
];
