import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import type { PrefabDefinition } from "../../../../definitions/prefab-definition";
import { ANIM_ORC_BOOMERANG_DEFINITION } from "./orc_boomerang_anim";

export const orcBoomerangDefinition = {
  components: {
    representable: {
      width: 35.2,
      height: 52.8,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x6b8e23
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
      range: 11
    },
    info: {
      name: "Orc Boomerang Thrower",
      description: "An agile orc skilled in ranged combat, hurling boomerang with deadly accuracy",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 110
    },
    attack: {
      attacks: [weaponDefinitions.OrcBoomerang]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 90
      },
      refundFactor: 0.5,
      productionTime: 5500,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 400
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_ORC_BOOMERANG_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
