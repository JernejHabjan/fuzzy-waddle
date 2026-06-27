import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ANIM_SKELETON_SCYTHE_DEFINITION } from "./skeleton_scythe_anim";
import { weaponDefinitions } from "../../../../../entity/components/combat/weapon-definitions";
import { ActorPhysicalType } from "../../../../../entity/components/combat/components/actor-physical-type";
import { PaymentType } from "../../../../../entity/components/production/payment-type";
import { AiType } from "../../../../ai-agents/ai-type";
import { type PrefabDefinition } from "../../../../definitions/prefab-definition";

export const skeletonScytheDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0xfffaf0
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
      range: 9
    },
    info: {
      name: "Skeleton Scythe",
      description: "A formidable skeletal reaper wielding a wicked scythe, harvesting souls with brutal sweeps",
      smallImage: {
        key: "factions",
        frame: "character_icons/general/warrior.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Organic,
      maxHealth: 130
    },
    attack: {
      attacks: [weaponDefinitions.SkeletonScythe]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 95
      },
      refundFactor: 0.5,
      productionTime: 5500,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 600
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_SKELETON_SCYTHE_DEFINITION }
  },
  systems: {
    movement: { enabled: true }
  }
} satisfies PrefabDefinition;
