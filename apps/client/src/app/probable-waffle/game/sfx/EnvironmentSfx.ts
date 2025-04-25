// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum EnvironmentSfx {
  BIRDS_1 = "birds 1",
  BIRDS_2 = "birds 2",
  BIRDS_3 = "birds 3",
  BIRDS_4 = "birds 4",
  BIRDS_5 = "birds 5",
  BIRDS_6 = "birds 6",
  LAVA_BUBBLING_1 = "lava bubbling 1",
  LAVA_BUBBLING_2 = "lava bubbling 2",
  LAVA_BUBBLING_3 = "lava bubbling 3",
  SEAGULLS_1 = "seagulls 1",
  SEAGULLS_2 = "seagulls 2",
  WATER_FLOWING_1 = "water flowing 1",
  WATER_FLOWING_2 = "water flowing 2"
}

export const EnvironmentSfxBirdsSounds: SoundDefinition[] = [
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.BIRDS_1 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.BIRDS_2 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.BIRDS_3 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.BIRDS_4 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.BIRDS_5 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.BIRDS_6 }
];

export const EnvironmentSfxLavaSounds: SoundDefinition[] = [
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.LAVA_BUBBLING_1 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.LAVA_BUBBLING_2 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.LAVA_BUBBLING_3 }
];

export const EnvironmentSfxSeagullsSounds: SoundDefinition[] = [
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.SEAGULLS_1 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.SEAGULLS_2 }
];

export const EnvironmentSfxWaterSounds: SoundDefinition[] = [
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.WATER_FLOWING_1 },
  { key: AudioSprites.ENVIRONMENT, spriteName: EnvironmentSfx.WATER_FLOWING_2 }
];
