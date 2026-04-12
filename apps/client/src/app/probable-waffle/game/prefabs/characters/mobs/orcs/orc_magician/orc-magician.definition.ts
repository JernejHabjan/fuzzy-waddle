import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_ORC_MAGICIAN_DEFINITION } from "./orc_magician_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const orcMagicianDefinition = {
  components: {
    representable: {
      width: 35.2,
      height: 52.8,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x556b2f
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
      range: 12
    },
    info: {
      name: "Orc Magician",
      description: "A powerful orc shaman wielding destructive fire magic to incinerate enemies from afar",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.FireSpell]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 120
      },
      refundFactor: 0.5,
      productionTime: 6500,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 450
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_ORC_MAGICIAN_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
