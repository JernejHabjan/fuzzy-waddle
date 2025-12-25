import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const miningCampDefinition = {
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
      name: "Mining Camp",
      description: "A camp for mining minerals and stone",
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/mining_camp/mining-camp.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 120
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 150
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
    },
    resourceDrain: {
      resourceTypes: [ResourceType.Minerals, ResourceType.Stone],
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
