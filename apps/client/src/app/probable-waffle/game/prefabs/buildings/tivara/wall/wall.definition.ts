import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import { PaymentType } from "../../../../entity/building/payment-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/health-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";

export const wallDefinition = {
  components: {
    representable: {
      width: 64,
      height: 96
    },
    objectDescriptor: {
      color: 0x95a083
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
      name: "Wall",
      description: "Defense building",
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/wall/wall_top_right_bottom_left.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    selectable: {},
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 300,
      healthDisplayBehavior: "onDamage"
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 10,
        [ResourceType.Stone]: 30
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
    },
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition,
      canBeDragPlaced: true
    },
    walkable: {
      walkableHeight: 42,
      exitHeight: 64,
      // can be accessed from the stairs
      acceptMinimumHeight: 64
    }
  }
} satisfies PrefabDefinition;
