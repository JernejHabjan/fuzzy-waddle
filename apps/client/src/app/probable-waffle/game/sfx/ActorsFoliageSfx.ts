// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum ActorsFoliageSfx {
  BUSH_RUSTLE_1 = "bush rustle 1",
  BUSH_RUSTLE_2 = "bush rustle 2"
}

export const ActorsFoliageSfxBushSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_FOLIAGE, spriteName: ActorsFoliageSfx.BUSH_RUSTLE_1 },
  { key: AudioSprites.ACTORS_FOLIAGE, spriteName: ActorsFoliageSfx.BUSH_RUSTLE_2 }
];
