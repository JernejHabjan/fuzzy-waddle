import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_PIRATE_SCIMITAR_DEFINITION } from "./pirate_scimitar_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const pirateScimitarDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0x1e3a5f
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
      name: "Pirate Scimitar",
      description: "A swift pirate wielding a curved blade, striking quickly with deadly precision",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 140
    },
    attack: {
      attacks: [weaponDefinitions.PirateScimitar]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 85
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
      tileMoveDuration: 350
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_PIRATE_SCIMITAR_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
