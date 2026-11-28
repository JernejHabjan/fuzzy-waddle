import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/controller/ai-type";
import { ANIM_BALLISTA_DEFINITION } from "./ballista_anims";

export const ballistaDefinition = {
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
      name: "Ballista",
      description: "A precision torsion engine firing heavy iron-tipped bolts capable of piercing armor and aerial foes.",
      tooltipDescription: ["Long-range piercing siege weapon","Can target both ground and air","Moderate movement speed"],
      smallImage: {
        key: "siege_weapons_ballista",
        frame: "level1/move/s/0.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 180,
      maxArmour: 15
    },
    attack: {
      attacks: [weaponDefinitions.BallistaBolt]
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Wood]: 120,
        [ResourceType.Stone]: 60,
        [ResourceType.Minerals]: 40
      },
      refundFactor: 0.5,
      productionTime: 18000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 2
    },
    buildingPrerequisites: {
      requiresAnyOf: [ObjectNames.TivaraSiegeWorkshop, ObjectNames.SkaduweeSiegeWorkshop]
    },
    translatable: {
      tileMoveDuration: 600
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {}
    },
    animatable: { animations: ANIM_BALLISTA_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
