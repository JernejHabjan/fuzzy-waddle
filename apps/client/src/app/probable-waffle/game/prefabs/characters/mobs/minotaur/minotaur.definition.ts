import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { ANIM_MINOTAUR_DEFINITION } from "./minotaur_anim";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";

export const minotaurDefinition = {
  components: {
    representable: {
      width: 64,
      height: 96,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x654321
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
      name: "Minotaur",
      description: "A fearsome bull-headed warrior with tremendous strength",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 250
    },
    attack: {
      attacks: [weaponDefinitions.MinotaurHands]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 130
      },
      refundFactor: 0.5,
      productionTime: 7000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 2
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 200
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_MINOTAUR_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
