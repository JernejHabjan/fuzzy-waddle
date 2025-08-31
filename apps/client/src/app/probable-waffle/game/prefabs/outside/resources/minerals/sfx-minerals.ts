import { type SoundDefinition } from "../../../../entity/components/audio-actor-component";
import { AudioSprites } from "../../../../sfx/AudioSprites";

export enum SfxMinerals {
  RESOURCES_MINERALS_SELECTION_1 = "resources minerals selection 1"
}

export const ActorsMineralsSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxMinerals.RESOURCES_MINERALS_SELECTION_1 }
];
