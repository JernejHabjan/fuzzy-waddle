import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import { ANIM_VIKING_BOAT_DEFINITION } from "./viking_boat_anims";

export const vikingBoatDefinition = {
  components: {
    representable: {
      width: 56,
      height: 56,
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
      range: 12
    },
    info: {
      name: "Viking Boat",
      description:
        "A fearsome longship of the north, built to weather storms and crush enemies. Its heavy hull and seasoned crew make it a formidable force on any sea.",
      tooltipDescription: [
        "Heavy armoured warship",
        "Fires powerful volleys at range",
        "Upgrades to fire arrows at level 2",
        "Cannot move on land"
      ],
      smallImage: {
        key: "units",
        frame: "common/viking-ship/ship9.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 240,
      maxArmour: 30
    },
    attack: {
      attacks: [weaponDefinitions.ShipVolley]
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Wood]: 120,
        [ResourceType.Stone]: 80,
        [ResourceType.Minerals]: 60
      },
      refundFactor: 0.5,
      productionTime: 25000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 2
    },
    requirements: {
      actors: [ObjectNames.Sandhold]
    },
    translatable: {
      tileMoveDuration: 450
    },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {
        // todo
      }
    },
    animatable: { animations: ANIM_VIKING_BOAT_DEFINITION },
    level: { level: 1, maxLevel: 2 }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  },
  meta: {
    maxLevel: 2,
    levelOverrides: {
      2: {
        components: {
          health: { maxHealth: 320, maxArmour: 45 },
          attack: {
            attacks: [weaponDefinitions.ShipFireVolley]
          }
        }
      }
    }
  }
} satisfies PrefabDefinition;
