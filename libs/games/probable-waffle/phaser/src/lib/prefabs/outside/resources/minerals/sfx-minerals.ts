import { AudioSprites } from "../../../../sfx/audio-sprites";
import type { SoundDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/actor-audio/sound-definition";

export enum SfxMinerals {
  RESOURCES_MINERALS_SELECTION_1 = "resources minerals selection 1"
}

export const ActorsMineralsSfxSelectionSounds: SoundDefinition[] = [
  { key: AudioSprites.ACTORS_RESOURCES, spriteName: SfxMinerals.RESOURCES_MINERALS_SELECTION_1 }
];
