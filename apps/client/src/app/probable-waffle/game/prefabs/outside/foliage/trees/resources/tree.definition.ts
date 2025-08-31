import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ActorsTreeSfxResourceDepletedSounds, ActorsTreeSfxSelectionSounds } from "./sfx-tree";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";

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
