import { PrefabDefinition } from "../../../../data/actor-definitions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import {
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION,
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE
} from "../../../gui/icon-animations";
import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { PaymentType } from "../../../../entity/building/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";

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
