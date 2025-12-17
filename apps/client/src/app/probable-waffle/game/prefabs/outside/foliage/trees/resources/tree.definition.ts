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
    info: {
      name: "Tree",
      description: "A tree that can be chopped for wood",
      smallImage: {
        key: "outside",
        frame: "foliage/trees/resources/tree1.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    resourceSource: {
      resourceType: ResourceType.Wood,
      maximumResources: 120,
      gatheringFactor: 10
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsTreeSfxSelectionSounds,
        ["depleted"]: ActorsTreeSfxResourceDepletedSounds
      }
    }
  }
} satisfies PrefabDefinition;
