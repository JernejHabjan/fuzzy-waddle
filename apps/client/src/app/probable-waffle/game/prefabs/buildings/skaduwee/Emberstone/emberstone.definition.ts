import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { SkaduweeEmberstoneSfxSelectionSounds } from "./SkaduweeEmberstoneSfx";

export const emberstoneDefinition = {
  components: {
    representable: {
      width: 32,
      height: 64
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x265b17,
          epsilon: 0.1
        }
      ]
    },
    vision: {
      range: 14
    },
    info: {
      name: "Emberstone",
      description:
        "A sentient monument where fire and ice intertwine, drawing power from the void to sustain the tribe’s dark ascent.",
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/olival/olival.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 100
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 100
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    requirements: {
      actors: [ObjectNames.Sandhold]
    },
    housing: {
      housingCapacity: 8
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    },
    audio: {
      sounds: {
        [SoundType.Select]: SkaduweeEmberstoneSfxSelectionSounds
      }
    }
  }
} satisfies PrefabDefinition;
