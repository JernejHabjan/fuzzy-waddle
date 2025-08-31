import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_IDLE
} from "../../../icon-animations";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const templeDefinition = {
  components: {
    representable: {
      width: 192,
      height: 192
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x5c9999,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 15
    },
    info: {
      name: "Hall of Echoing Rites",
      description:
        "Ancient fabrics sway between crumbling pillars, and the air hums with ritual echoes long buried in the sand",
      portraitAnimation: {
        idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_IDLE,
        action: ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_ACTION
      },
      smallImage: {
        key: "factions",
        frame: "building_icons/tivara/temple.png",
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
    requirements: {
      actors: [ObjectNames.AnkGuard]
    },
    production: {
      queueCount: 1,
      capacityPerQueue: 5,
      availableProduceActors: [ObjectNames.TivaraSlingshotFemale]
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
