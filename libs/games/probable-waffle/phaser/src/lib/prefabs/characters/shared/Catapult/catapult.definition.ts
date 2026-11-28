import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/controller/ai-type";
import { ANIM_CATAPULT_DEFINITION } from "./catapult_anims";

export const catapultDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64,
      origin: { x: 0.5, y: 0.65 }
    },
    objectDescriptor: {
      color: 0x8b6b43
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
      name: "Catapult",
      description: "A heavy wooden siege engine that hurls boulders across great distances to shatter fortifications.",
      tooltipDescription: ["Long-range siege artillery","Strong against buildings","Slow movement speed","Has minimum attack range"],
      smallImage: {
        key: "siege_weapons_catapult",
        frame: "level1/move/s/0.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 220,
      maxArmour: 20
    },
    attack: {
      attacks: [weaponDefinitions.CatapultRock]
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Wood]: 140,
        [ResourceType.Stone]: 100
      },
      refundFactor: 0.5,
      productionTime: 22000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 3
    },
    buildingPrerequisites: {
      requiresAnyOf: [ObjectNames.TivaraSiegeWorkshop, ObjectNames.SkaduweeSiegeWorkshop]
    },
    translatable: {
      tileMoveDuration: 700
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {}
    },
    animatable: { animations: ANIM_CATAPULT_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
