import { PrefabDefinition } from "../../../../data/actor-definitions";
import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";

export const stairsDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64
    },
    objectDescriptor: {
      color: 0x95a083
    },
    info: {
      name: "Stairs",
      description: "Used to move to top of the Wall and Watch Tower",
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/stairs/stairs_top_left.png",
        origin: { x: 0.5, y: 0.5 }
      }
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
    walkable: {
      walkableHeight: 24,
      exitHeight: 64,
      acceptMinimumHeight: 0
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
        [ResourceType.Minerals]: 10
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
    },
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
