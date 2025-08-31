import { SoundType } from "../../../../entity/components/audio-actor-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ActorsStoneSfxOutOfResourcesSounds, ActorsStoneSfxSelectionSounds } from "./sfx-stone";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const stonePileDefinition = {
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
      resourceType: ResourceType.Stone,
      maximumResources: 100,
      gatheringFactor: 1
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsStoneSfxSelectionSounds,
        ["depleted"]: ActorsStoneSfxOutOfResourcesSounds
      }
    }
  }
} satisfies PrefabDefinition;
