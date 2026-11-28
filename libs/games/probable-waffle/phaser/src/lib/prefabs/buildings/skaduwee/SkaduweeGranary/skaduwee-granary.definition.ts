import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";

export const skaduweeGranaryDefinition = {
  components: {
    representable: {
      width: 128,
      height: 128,
      origin: { x: 0.5, y: 0.75 }
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        {
          originalColor: 0x0044dd,
          epsilon: 0.15
        }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Frostbarn",
      description: "A timber-framed cold cellar where Skaduwee gatherers preserve harvests beneath the frost.",
      tooltipDescription: ["Drop-off point for food","Place near fields","Unlocks Field construction","Reduces worker travel time"],
      smallImage: {
        key: "factions",
        frame: "buildings/skaduwee/granary/skaduwee-granary3.png",
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
