import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import {
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION,
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE
} from "../../../icon-animations";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const owleryDefinition = {
  components: {
    representable: {
      width: 64,
      height: 192
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        {
          originalColor: 0xf4f5f7,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 16
    },
    info: {
      name: "Owlery",
      description: "Produces Owls",
      portraitAnimation: {
        idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE,
        action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION
      },
      smallImage: {
        key: "factions",
        frame: "building_icons/skaduwee/owlery.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 200,
      maxArmour: 200
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 100,
        [ResourceType.Stone]: 200
      },
      refundFactor: 0.5,
      productionTime: 30000,
      costType: PaymentType.PayImmediately
    },
    production: {
      queueCount: 1,
      capacityPerQueue: 5,
      availableProduceActors: [ObjectNames.SkaduweeOwl]
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
