import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/controller/ai-type";
import { ANIM_CANNON_DEFINITION } from "./cannon_anims";

export const cannonDefinition = {
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
      name: "Cannon",
      description: "A thunderous iron bombard that fires heavy cannonballs with devastating impact against structures.",
      tooltipDescription: ["Heavy black-powder artillery","Massive damage against buildings","Slow reload and movement"],
      smallImage: {
        key: "siege_weapons_cannon",
        frame: "move/s/0.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 240,
      maxArmour: 30
    },
    attack: {
      attacks: [weaponDefinitions.CannonShot]
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Wood]: 120,
        [ResourceType.Stone]: 100,
        [ResourceType.Minerals]: 100
      },
      refundFactor: 0.5,
      productionTime: 26000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 3
    },
    buildingPrerequisites: {
      requiresAnyOf: [ObjectNames.TivaraSiegeWorkshop, ObjectNames.SkaduweeSiegeWorkshop]
    },
    translatable: {
      tileMoveDuration: 750
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {}
    },
    animatable: { animations: ANIM_CANNON_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
