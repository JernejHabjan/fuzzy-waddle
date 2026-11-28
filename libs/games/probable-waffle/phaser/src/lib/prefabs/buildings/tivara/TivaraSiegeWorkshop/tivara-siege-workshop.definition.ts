import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";

export const tivaraSiegeWorkshopDefinition = {
  components: {
    representable: {
      width: 192,
      height: 192,
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
      range: 14
    },
    info: {
      name: "Dune Siegeworks",
      description: "A fortified sandstone yard where Tivara engineers assemble heavy catapults, ballistae, and cannons.",
      tooltipDescription: ["Builds heavy siege engines","Produces Catapults, Ballistae, and Cannons","Requires Ank Guard"],
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/workshop/tivara-siege-workshop3.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 350,
      maxArmour: 150
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 200,
        [ResourceType.Stone]: 150
      },
      refundFactor: 0.5,
      productionTime: 28000,
      costType: PaymentType.PayImmediately
    },
    buildingPrerequisites: {
      requiresAnyOf: [ObjectNames.AnkGuard]
    },
    production: {
      availableProduceActors: [ObjectNames.Catapult, ObjectNames.Ballista, ObjectNames.Cannon]
    },
    queue: {
      queueCount: 1,
      capacityPerQueue: 5
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
