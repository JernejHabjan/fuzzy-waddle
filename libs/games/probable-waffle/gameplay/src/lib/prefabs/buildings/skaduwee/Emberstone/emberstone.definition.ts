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
      width: 64,
      height: 112,
      origin: { x: 0.5, y: 0.75 }
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0xbf990f,
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
        "A sentient monument where fire and ice intertwine, drawing power from the void to sustain the tribe's dark ascent.",
      tooltipDescription: ["Provides additional housing", "Expands population capacity"],
      smallImage: {
        key: "factions",
        frame: "buildings/skaduwee/ember_stone/ember_stone1.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 200
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
      actors: [ObjectNames.FrostForge]
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
