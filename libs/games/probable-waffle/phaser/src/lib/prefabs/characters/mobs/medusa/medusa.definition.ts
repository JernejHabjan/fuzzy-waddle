import { ANIM_MEDUSA_DEFINITION } from "./anims-medusa";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";
import { SpellType } from "../../../../entity/components/combat/spell-type";

export const medusaDefinition = {
  components: {
    representable: {
      width: 60,
      height: 80,
      origin: { x: 0.5, y: 0.9 }
    },
    objectDescriptor: {
      color: 0x222e37
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
      name: "Medusa",
      description:
        "A fearsome serpent queen that overwhelms nearby enemies with venomous snakes and can paralyze a single foe with her petrifying gaze.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 200
    },
    attack: {
      attacks: [weaponDefinitions.MedusaSnakes]
    },
    spell: {
      availableSpells: [SpellType.MedusaGaze]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 140,
        [ResourceType.Stone]: 100
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 3
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 400
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_MEDUSA_DEFINITION },
    audio: {
      sounds: {
        // todo
      }
    }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
