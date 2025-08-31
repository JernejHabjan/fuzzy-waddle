import type { PrefabDefinition } from "../../../../data/actor-definitions";
import { SoundType } from "../../../../entity/actor/components/audio-actor-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ActorsMineralsSfxSelectionSounds } from "./sfx-minerals";
import { ActorsStoneSfxOutOfResourcesSounds } from "../stone-pile/sfx-stone";

export const mineralsDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64
    },
    objectDescriptor: {
      color: 0xbea55b
    },
    collider: {
      enabled: true
    },
    selectable: { offsetY: 16 },
    resourceSource: {
      resourceType: ResourceType.Minerals,
      maximumResources: 100,
      gatheringFactor: 1
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsMineralsSfxSelectionSounds,
        ["depleted"]: ActorsStoneSfxOutOfResourcesSounds
      }
    }
  }
} satisfies PrefabDefinition;
