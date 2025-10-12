import { type SoundDefinition } from "../../../../entity/components/actor-audio/audio-actor-component";
import { AudioSprites } from "../../../../sfx/audio-sprites";

export enum SfxStone {
  RESOURCES_STONE_OUT_OF_RESOURCES = "resources stone out of resources",
  RESOURCES_STONE_SELECTION_1 = "resources stone selection 1",
  RESOURCES_STONE_SELECTION_2 = "resources stone selection 2"
}
export const ActorsStoneSfxOutOfResourcesSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxStone.RESOURCES_STONE_OUT_OF_RESOURCES }
];
export const ActorsStoneSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxStone.RESOURCES_STONE_SELECTION_1 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxStone.RESOURCES_STONE_SELECTION_2 }
];
