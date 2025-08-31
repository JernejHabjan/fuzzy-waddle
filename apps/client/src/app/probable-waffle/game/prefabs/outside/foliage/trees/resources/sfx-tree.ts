import { type SoundDefinition } from "../../../../../entity/components/actor-audio/audio-actor-component";
import { AudioSprites } from "../../../../../sfx/AudioSprites";

export enum SfxTree {
  RESOURCES_TREE_RESOURCE_DEPLETED = "resources tree resource depleted",
  RESOURCES_TREE_SELECTION_1 = "resources tree selection 1",
  RESOURCES_TREE_SELECTION_2 = "resources tree selection 2",
  RESOURCES_TREE_SELECTION_3 = "resources tree selection 3",
  RESOURCES_TREE_SELECTION_4 = "resources tree selection 4",
  RESOURCES_TREE_SELECTION_5 = "resources tree selection 5"
}

export const ActorsTreeSfxResourceDepletedSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxTree.RESOURCES_TREE_RESOURCE_DEPLETED }
];
export const ActorsTreeSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxTree.RESOURCES_TREE_SELECTION_1 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxTree.RESOURCES_TREE_SELECTION_2 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxTree.RESOURCES_TREE_SELECTION_3 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxTree.RESOURCES_TREE_SELECTION_4 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxTree.RESOURCES_TREE_SELECTION_5 }
];
