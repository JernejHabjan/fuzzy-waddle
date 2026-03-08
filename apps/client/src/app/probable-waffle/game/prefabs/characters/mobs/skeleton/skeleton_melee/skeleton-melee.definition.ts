import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_SKELETON_MELEE_DEFINITION } from "./skeleton_melee_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const skeletonMeleeDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0xd3d3d3
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
      range: 8
    },
    info: {
      name: "Skeleton Melee",
      description: "A basic skeletal warrior clawing at enemies with bony hands, weak but numerous",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Organic,
      maxHealth: 70
    },
    attack: {
      attacks: [weaponDefinitions.SkeletonHands]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 50
      },
      refundFactor: 0.5,
      productionTime: 3500,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 550
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_SKELETON_MELEE_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
