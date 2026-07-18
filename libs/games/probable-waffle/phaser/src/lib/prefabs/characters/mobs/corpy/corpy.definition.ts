import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ANIM_CORPY_DEFINITION } from "./corpy_anim";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";

export const corpyDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.8 }
    },
    objectDescriptor: {
      color: 0x920733
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
      name: "Corpy",
      description:
        "A venomous scorpion that tears apart nearby enemies with its claws and spits corrosive acid at distant targets.",
      tooltipDescription: [
        "Melee claws and ranged acid attack",
        "Can attack both ground and air units",
        "Versatile combat creature"
      ],
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/alchemist.png", // todo
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 120
    },
    attack: {
      attacks: [weaponDefinitions.CorpyClaws, weaponDefinitions.CorpyAcid]
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
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_CORPY_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
