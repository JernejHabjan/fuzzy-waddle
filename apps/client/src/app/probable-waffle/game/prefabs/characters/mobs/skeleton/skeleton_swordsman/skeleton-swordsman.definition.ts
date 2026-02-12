import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_GENERAL_WARRIOR_DEFINITION } from "./skeleton_swordsman_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const skeletonSwordsmanDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0xfffff0
    },
    owner: {
      color: [
        {
          originalColor: 0x000000,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 9
    },
    info: {
      name: "Skeleton Swordsman",
      description: "An undead warrior wielding a rusty blade, still deadly despite its decayed state",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Organic,
      maxHealth: 110
    },
    attack: {
      attacks: [weaponDefinitions.SkeletonSword]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 70
      },
      refundFactor: 0.5,
      productionTime: 4500,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 500
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_GENERAL_WARRIOR_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
