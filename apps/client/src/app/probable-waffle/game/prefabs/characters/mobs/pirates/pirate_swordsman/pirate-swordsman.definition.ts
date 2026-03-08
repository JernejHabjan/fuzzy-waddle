import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_PIRATE_SWORDSMAN_DEFINITION } from "./pirate_swordsman_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const pirateSwordsmanDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x2f4f4f
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
      range: 10
    },
    info: {
      name: "Pirate Swordsman",
      description: "A seasoned pirate brandishing a sharp sword, ready to plunder and fight",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 150
    },
    attack: {
      attacks: [weaponDefinitions.PirateScimitar]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 80
      },
      refundFactor: 0.5,
      productionTime: 5000,
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
    animatable: { animations: ANIM_PIRATE_SWORDSMAN_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
