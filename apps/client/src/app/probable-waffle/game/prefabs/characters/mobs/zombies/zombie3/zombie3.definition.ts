import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_ZOMBIE3_DEFINITION } from "./zombie3_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const zombie3Definition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x6b4423
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
      name: "Hulking Zombie",
      description: "A massive zombie with enhanced durability, lumbering toward its prey with unstoppable force",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Organic,
      maxHealth: 160
    },
    attack: {
      attacks: [weaponDefinitions.ZombieLargeHands]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 75
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
      tileMoveDuration: 650
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_ZOMBIE3_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
