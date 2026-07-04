import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE
} from "../../../icon-animations";
import { getBuildingQueueCapabilities, ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const sandholdDefinition = {
  components: {
    representable: {
      width: 288,
      height: 280,
      origin: { x: 0.5, y: 0.8 }
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x4dbd33,
          epsilon: 0.1
        }
      ]
    },
    vision: {
      range: 20
    },
    info: {
      name: "Sandhold",
      description:
        "A monument of stone and shadow, Sandhold is the cradle of Tivara's power, commanding the restless workers and hoarding the lifeblood of the desert",
      tooltipDescription: [
        "Main base of operations",
        "Trains workers for economy",
        "Collects and stores resources",
        "Provides housing for units"
      ],
      portraitAnimation: {
        idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE,
        action: ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION
      },
      smallImage: {
        key: "factions",
        frame: "building_icons/tivara/sandhold.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 500,
      maxArmour: 300
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 400,
        [ResourceType.Stone]: 400
      },
      refundFactor: 0.5,
      productionTime: 60000,
      costType: PaymentType.PayImmediately
    },
    housing: {
      housingCapacity: 8
    },
    container: {
      capacity: 2
    },
    resourceDrain: {
      resourceTypes: [ResourceType.Wood, ResourceType.Minerals, ResourceType.Stone, ResourceType.Food],
      cooldown: 1000
    },
    production: {
      availableProduceActors: getBuildingQueueCapabilities(ObjectNames.Sandhold)!.availableProduceActors!
    },
    queue: {
      queueCount: 1,
      capacityPerQueue: 5
    },
    research: {
      availableResearch: getBuildingQueueCapabilities(ObjectNames.Sandhold)!.availableResearch!
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  },
  meta: {
    isMainBuilding: true
  }
} satisfies PrefabDefinition;
