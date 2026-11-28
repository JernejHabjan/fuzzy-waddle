import { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";

export const tivaraDockDefinition = {
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
      range: 16
    },
    info: {
      name: "Oasis Pier",
      description: "A sunlit desert wharf where Tivara shipwrights launch river transports and warships.",
      tooltipDescription: [
        "Must be placed on the shoreline (land and water)",
        "Builds transport boats and warships",
        "Researches naval upgrades"
      ],
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/dock/tivara-dock3.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 350,
      maxArmour: 100
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 180,
        [ResourceType.Stone]: 60
      },
      refundFactor: 0.5,
      productionTime: 22000,
      costType: PaymentType.PayImmediately
    },
    production: {
      availableProduceActors: [ObjectNames.CommonBoat, ObjectNames.VikingBoat]
    },
    research: {
      availableResearch: [ResearchType.CommonBoatUpgradeLevel2, ResearchType.VikingBoatUpgradeLevel2]
    },
    queue: {
      queueCount: 1,
      capacityPerQueue: 5
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition,
      placementRule: "coastal"
    }
  }
} satisfies PrefabDefinition;
