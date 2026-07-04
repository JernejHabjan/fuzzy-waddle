import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const granaryDefinition = {
  components: {
    representable: {
      width: 128,
      height: 128,
      origin: { x: 0.5, y: 0.75 }
    },
    objectDescriptor: {
      color: 0xc8a84b
    },
    owner: {
      color: [
        {
          originalColor: 0x825e39,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Granary",
      description: "A sturdy storehouse where farmers deposit their harvest",
      tooltipDescription: ["Drop-off point for food", "Place near fields", "Reduces farmer travel time"],
      smallImage: {
        key: "factions",
        frame: "buildings/misc/ruins-flat/ruins-flat-1.png",
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
