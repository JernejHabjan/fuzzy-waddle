import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";

export const skaduweeSiegeWorkshopDefinition = {
  components: {
    representable: {
      width: 192,
      height: 192,
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
      range: 14
    },
    info: {
      name: "Ironfrost Siegeworks",
      description: "A timber-and-slate foundry where Skaduwee artificers forge heavy siege machinery.",
      tooltipDescription: ["Builds heavy siege engines","Produces Catapults, Ballistae, and Cannons","Requires Infantry Inn"],
      smallImage: {
        key: "factions",
        frame: "buildings/skaduwee/workshop/skaduwee-siege-workshop3.png",
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
      requiresAnyOf: [ObjectNames.InfantryInn]
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
