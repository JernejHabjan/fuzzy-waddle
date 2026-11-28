import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";

export const tivaraGranaryDefinition = {
  components: {
    representable: {
      width: 128,
      height: 128,
      origin: { x: 0.5, y: 0.75 }
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x008a45,
          epsilon: 0.15
        }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Sunvault Granary",
      description: "A sun-baked sandstone storehouse where Tivara harvesters safeguard grain against the desert heat.",
      tooltipDescription: ["Drop-off point for food","Place near fields","Unlocks Field construction","Reduces worker travel time"],
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/granary/tivara-granary3.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 150
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 80
      },
      refundFactor: 0.5,
      productionTime: 12000,
      costType: PaymentType.PayImmediately
    },
    resourceDrain: {
      resourceTypes: [ResourceType.Food],
      cooldown: 1000
    },
    selectable: {},
    collider: { enabled: true },
    container: {
      capacity: 2
    },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
