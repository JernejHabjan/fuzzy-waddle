import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ActorsStoneSfxOutOfResourcesSounds, ActorsStoneSfxSelectionSounds } from "./sfx-stone";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";

export const stonePileDefinition = {
  components: {
    representable: {
      width: 64,
      height: 32,
      origin: { x: 0.5, y: 0.7378671494275097 }
    },
    objectDescriptor: {
      color: 0xbea55b
    },
    collider: {
      enabled: true
    },
    selectable: { offsetY: 16 },
    info: {
      name: "Stone Pile",
      description: "A pile of stone waiting to be gathered",
      tooltipDescription: ["Provides stone resource", "Send workers to harvest"],
      smallImage: {
        key: "outside",
        frame: "nature/resources/stone_pile_1.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    resourceSource: {
      resourceType: ResourceType.Stone,
      maximumResources: 500,
      gatheringFactor: 6,
      maxGatherers: 2,
      cooldown: 2000
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsStoneSfxSelectionSounds,
        ["depleted"]: ActorsStoneSfxOutOfResourcesSounds
      }
    }
  }
} satisfies PrefabDefinition;
