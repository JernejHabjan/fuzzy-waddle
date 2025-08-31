import { type SoundDefinition } from "../../../../../entity/components/actor-audio/audio-actor-component";
import { AudioSprites } from "../../../../../sfx/AudioSprites";

export enum SfxBush {
  BUSH_RUSTLE_1 = "bush rustle 1",
  BUSH_RUSTLE_2 = "bush rustle 2"
}

export const ActorsFoliageSfxBushSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_FOLIAGE, spriteName: SfxBush.BUSH_RUSTLE_1 },
  { key: AudioSprites.ACTORS_FOLIAGE, spriteName: SfxBush.BUSH_RUSTLE_2 }
];
