import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { AiType } from "../../../ai-agents/ai-type";
import { ANIM_COMMON_BOAT_DEFINITION } from "./common_boat_anims";
import { MovementTerrainType } from "../../../../entity/components/movement/movement-terrain-type";

export const commonBoatDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64,
      origin: { x: 0.5, y: 0.5 }
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
      range: 10
    },
    info: {
      name: "Common Boat",
      description:
        "A sturdy transport vessel built to ferry troops across the water. Dock at shore to load and unload units.",
      tooltipDescription: [
        "Transport vessel — carries units across water",
        "Load units while docked at shore",
        "Unload units at any shore tile",
        "Cannot move on land"
      ],
      smallImage: {
        key: "units",
        frame: "common/boat/common_boat-24.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 120,
      maxArmour: 10
    },
    container: {
      capacity: 4
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Wood]: 60,
        [ResourceType.Stone]: 40
      },
      refundFactor: 0.5,
      productionTime: 15000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    requirements: {
      actors: [ObjectNames.Sandhold]
    },
    translatable: {
      tileMoveDuration: 350,
      movementTerrainType: MovementTerrainType.Water
    },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {
        // todo
      }
    },
    shipAnimatable: { animations: ANIM_COMMON_BOAT_DEFINITION },
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
          health: { maxHealth: 160, maxArmour: 15 },
          container: { capacity: 6 }
        }
      }
    }
  }
} satisfies PrefabDefinition;
