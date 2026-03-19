import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import { ANIM_CYCLOPS_DEFINITION } from "./cyclops_anim";

export const cyclopsDefinition = {
  components: {
    representable: {
      width: 80,
      height: 120,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x8b4513
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
      name: "Cyclops",
      description: "A massive one-eyed giant wielding a mighty halberd, slow but devastating in combat",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 3000
    },
    attack: {
      attacks: [weaponDefinitions.CyclopsHalberd]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 150
      },
      refundFactor: 0.5,
      productionTime: 8000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 2
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 300
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_CYCLOPS_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
