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
    info: {
      name: "Mineral Deposit",
      description: "A deposit of valuable minerals ready for extraction",
      smallImage: {
        key: "outside",
        frame: "nature/resources/minerals_pile_1.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
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
