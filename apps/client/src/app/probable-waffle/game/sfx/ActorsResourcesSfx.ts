// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum ActorsResourcesSfx {
  RESOURCES_MINERALS_SELECTION_1 = "resources minerals selection 1",
  RESOURCES_STONE_OUT_OF_RESOURCES = "resources stone out of resources",
  RESOURCES_STONE_SELECTION_1 = "resources stone selection 1",
  RESOURCES_STONE_SELECTION_2 = "resources stone selection 2",
  RESOURCES_TREE_RESOURCE_DEPLETED = "resources tree resource depleted",
  RESOURCES_TREE_SELECTION_1 = "resources tree selection 1",
  RESOURCES_TREE_SELECTION_2 = "resources tree selection 2",
  RESOURCES_TREE_SELECTION_3 = "resources tree selection 3",
  RESOURCES_TREE_SELECTION_4 = "resources tree selection 4",
  RESOURCES_TREE_SELECTION_5 = "resources tree selection 5"
}

export const ActorsMineralsSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_MINERALS_SELECTION_1 }
];
export const ActorsStoneSfxOutOfResourcesSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_STONE_OUT_OF_RESOURCES }
];
export const ActorsStoneSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_STONE_SELECTION_1 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_STONE_SELECTION_2 }
];
export const ActorsTreeSfxResourceDepletedSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_TREE_RESOURCE_DEPLETED }
];
export const ActorsTreeSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_TREE_SELECTION_1 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_TREE_SELECTION_2 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_TREE_SELECTION_3 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_TREE_SELECTION_4 },
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: ActorsResourcesSfx.RESOURCES_TREE_SELECTION_5 }
];
