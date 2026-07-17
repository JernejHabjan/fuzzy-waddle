import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const fieldDefinition = {
  components: {
    representable: {
      width: 128,
      height: 64,
      origin: { x: 0.5, y: 0.75 }
    },
    objectDescriptor: {
      color: 0x8b6914
    },
    owner: {
      color: [
        {
          originalColor: 0x825e39,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 2
    },
    info: {
      name: "Field",
      description: "A plot of fertile land where farmers tend crops through seeding, growth, and harvest",
      tooltipDescription: [
        "Assign a farmer to tend crops",
        "Goes through seeding and growth phases",
        "Harvest food when crops are ripe",
        "Requires Granary nearby to drop off food"
      ],
      smallImage: {
        key: "factions",
        frame: "buildings/misc/ruins-flat/ruins-flat-1.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 100,
      healthDisplayBehavior: "onDamage"
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 60
      },
      refundFactor: 0.5,
      productionTime: 0,
      costType: PaymentType.PayImmediately
    },
    requirements: {
      actors: [ObjectNames.Granary]
    },
    selectable: {},
    collider: { enabled: false }, // field is not a collider - can be walked over
    constructable: {
      ...coreConstructionSiteDefinition,
      maxAssignedBuilders: 0,
      startImmediately: true,
      progressMadeAutomatically: 1000,
      initialHealthPercentage: 1.0
    },
    resourceSource: {
      resourceType: ResourceType.Food,
      maximumResources: 30,
      maxGatherers: 1,
      cooldown: 2000,
      gatheringFactor: 1,
      respawnOnDepletion: true,
      needsReturnToDrain: true
    },
    tendable: {
      growthDurationMs: 45000,
      tenderBoostMultiplier: 2,
      maxTenders: 1,
      autoStart: false
    }
  }
} satisfies PrefabDefinition;
