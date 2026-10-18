import { ANIM_METAL_GOLEM_DEFINITION } from "./anims-metal_golem";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";

export const metalGolemDefinition = {
  components: {
    representable: {
      width: 112,
      height: 112,
      origin: { x: 0.5, y: 0.9 }
    },
    objectDescriptor: {
      color: 0x222e37
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
      name: "Metal Golem",
      description:
        "A heavily armored construct forged from enchanted metal, combining unmatched resilience with devastating physical strength.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological, // todo not really
      maxHealth: 1200
    },
    attack: {
      attacks: [weaponDefinitions.EarthGolemSmash]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 300,
        [ResourceType.Stone]: 300
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 5
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 600
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_METAL_GOLEM_DEFINITION },
    audio: {
      sounds: {
        // todo
      }
    }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
