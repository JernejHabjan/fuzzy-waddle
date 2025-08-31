import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { SoundType } from "../../../../../entity/components/audio-actor-component";
import { ActorsTreeSfxResourceDepletedSounds, ActorsTreeSfxSelectionSounds } from "./sfx-tree";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";

export const treeDefinitions = {
  components: {
    objectDescriptor: {
      color: 0xbea55b
    },
    collider: {
      enabled: true,
      colliderFactorReduction: 0.5
    },
    selectable: {},
    resourceSource: {
      resourceType: ResourceType.Wood,
      maximumResources: 20,
      gatheringFactor: 1
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsTreeSfxSelectionSounds,
        ["depleted"]: ActorsTreeSfxResourceDepletedSounds
      }
    }
  }
} satisfies PrefabDefinition;
