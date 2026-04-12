import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import { ANIM_TIVARA_ALCHEMIST_DEFINITION } from "./tivara_alchemist_anims";

export const tivaraAlchemistDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.8 }
    },
    objectDescriptor: {
      color: 0xe9ecf2
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
      range: 14
    },
    info: {
      name: "Alchemist",
      description:
        "A master of potions and elixirs, this cunning character uses volatile concoctions to damage enemies and support allies",
      tooltipDescription: [
        "Can throw explosive potions to damage enemies",
        "Can brew supportive elixirs for allies",
        "Effective against groups of enemies"
      ],
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/alchemist.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 80
    },
    attack: {
      attacks: [weaponDefinitions.AlchemistVase]
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Stone]: 40,
        [ResourceType.Food]: 100
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    requirements: {
      actors: [ObjectNames.Temple]
    },
    translatable: {
      tileMoveDuration: 300
    },
    flying: {
      height: 128
    },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_TIVARA_ALCHEMIST_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
