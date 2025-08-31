import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { weaponDefinitions } from "../../../../entity/combat/attack-data";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../../data/prefab-definition";

export const watchTowerDefinition = {
  components: {
    representable: {
      width: 128,
      height: 176
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
      range: 18
    },
    info: {
      name: "Watch Tower",
      description: "Main defense building",
      smallImage: {
        key: "factions",
        frame: "buildings/tivara/watchtower.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    selectable: {},
    walkable: {
      walkableHeight: 128,
      exitHeight: 128,
      // can be accessed from the stairs or a wall
      acceptMinimumHeight: 64
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 1000,
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
    // note - this unit can be walked on and can not contain units
    // container: {
    //   capacity: 2
    // },
    attack: {
      attacks: [weaponDefinitions.bowTower]
    },
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
