import { ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN } from "../../../icon-animations";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const infantryInnDefinition = {
  components: {
    representable: {
      width: 128,
      height: 128
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        {
          originalColor: 0x7d9cdb,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 15
    },
    info: {
      name: "Infantry Inn",
      description: "Trains infantry units",
      portraitAnimation: {
        idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN,
        action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN
      },
      smallImage: {
        key: "factions",
        frame: "building_icons/skaduwee/infantry_inn.png",
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
      availableProduceActors: [
        ObjectNames.SkaduweeMagicianFemale,
        ObjectNames.SkaduweeRangedFemale,
        ObjectNames.SkaduweeWarriorMale
      ]
    },
    selectable: {},
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
