import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../../data/prefab-definition";

export const workMillDefinition = {
  components: {
    representable: {
      width: 128,
      height: 128
    },
    objectDescriptor: {
      color: 0x967847
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
      range: 14
    },
    info: {
      name: "Work Mill",
      description: "A sturdy mill that turns raw timber into vital resources",
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/workmill.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 100
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 10,
        [ResourceType.Minerals]: 10
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
    },
    resourceDrain: {
      resourceTypes: [ResourceType.Wood]
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
