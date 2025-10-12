import { ANIM_BUILDING_ICON_ANIMS_SKADUWEE_FROST_FORGE } from "../../../icon-animations";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { coreConstructionSiteDefinition } from "../../shared/core-construction-site.definition";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const frostForgeDefinition = {
  components: {
    representable: {
      width: 256,
      height: 384
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    housing: {
      housingCapacity: 8
    },
    owner: {
      color: [
        {
          originalColor: 0x7d9cdb,
          epsilon: 0
        }
      ]
    },
    vision: {
      range: 20
    },
    info: {
      name: "Frost Forge",
      description: "Main building of the Skaduwee faction. It is used to produce workers and store resources.",
      portraitAnimation: {
        idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_FROST_FORGE,
        action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_FROST_FORGE
      },
      smallImage: {
        key: "factions",
        frame: "building_icons/skaduwee/frost_forge.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Structural,
      maxHealth: 100
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 400,
        [ResourceType.Minerals]: 300,
        [ResourceType.Stone]: 400
      },
      refundFactor: 0.5,
      productionTime: 60000,
      costType: PaymentType.PayImmediately
    },
    selectable: {},
    container: {
      capacity: 2
    },
    resourceDrain: {
      resourceTypes: [ResourceType.Wood, ResourceType.Minerals, ResourceType.Stone, ResourceType.Ambrosia]
    },
    production: {
      queueCount: 1,
      capacityPerQueue: 5,
      availableProduceActors: [ObjectNames.SkaduweeWorker]
    },
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
} satisfies PrefabDefinition;
