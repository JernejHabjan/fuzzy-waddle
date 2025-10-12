import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_IDLE
} from "../../../icon-animations";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const ankGuardDefinition = {
  components: {
    representable: {
      width: 256,
      height: 256
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x800080,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 15
    },
    info: {
      name: "Ank Guard",
      description: "Oozing with ancient curse, this fortress births the mightiest of Tivara’s infantry",
      portraitAnimation: {
        idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_IDLE,
        action: ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_ACTION
      },
      smallImage: {
        key: "factions",
        frame: "building_icons/tivara/ankguard.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 100
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 200,
        [ResourceType.Stone]: 50
      },
      refundFactor: 0.5,
      productionTime: 20000,
      costType: PaymentType.PayImmediately
    },
    production: {
      queueCount: 1,
      capacityPerQueue: 5,
      availableProduceActors: [ObjectNames.TivaraSlingshotFemale, ObjectNames.TivaraMacemanMale]
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
