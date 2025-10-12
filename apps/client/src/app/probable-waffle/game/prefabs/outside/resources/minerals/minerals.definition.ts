import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ActorsMineralsSfxSelectionSounds } from "./sfx-minerals";
import { ActorsStoneSfxOutOfResourcesSounds } from "../stone-pile/sfx-stone";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";

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
      maximumResources: 500,
      gatheringFactor: 6
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsMineralsSfxSelectionSounds,
        ["depleted"]: ActorsStoneSfxOutOfResourcesSounds
      }
    }
  }
} satisfies PrefabDefinition;
