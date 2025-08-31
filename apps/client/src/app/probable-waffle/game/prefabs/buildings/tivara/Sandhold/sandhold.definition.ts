import { ActorPhysicalType } from "../../../../entity/components/combat/components/health-component";
import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE
} from "../../../gui/icon-animations";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const sandholdDefinition = {
  components: {
    representable: {
      width: 320,
      height: 320
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
        "A monument of stone and shadow, Sandhold is the cradle of Tivara’s power, commanding the restless workers and hoarding the lifeblood of the desert",
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
      maxHealth: 100,
      maxArmour: 50
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
    container: {
      capacity: 2
    },
    resourceDrain: {
      resourceTypes: [ResourceType.Wood, ResourceType.Minerals, ResourceType.Stone, ResourceType.Ambrosia]
    },
    production: {
      queueCount: 1,
      capacityPerQueue: 5,
      availableProduceActors: [ObjectNames.TivaraWorker]
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
