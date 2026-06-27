import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { ANIM_MUMMY_DEFINITION } from "./mummy_anim";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";

export const mummyDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0xd2b48c
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
      range: 7
    },
    info: {
      name: "Mummy",
      description: "An ancient undead warrior wrapped in decaying bandages, relentlessly shambling forward",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Organic,
      maxHealth: 120
    },
    attack: {
      attacks: [weaponDefinitions.MummyHands]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 60
      },
      refundFactor: 0.5,
      productionTime: 4000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 800
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_MUMMY_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
