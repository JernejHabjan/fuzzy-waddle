import { ANIM_EARTH_GOLEM_DEFINITION } from "./anims-earth_golem";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";

export const earthGolemDefinition = {
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
      name: "Earth Golem",
      description:
        "A towering guardian formed from the earth itself, capable of withstanding tremendous punishment while crushing nearby foes.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological, // todo not really
      maxHealth: 800
    },
    attack: {
      attacks: [weaponDefinitions.EarthGolemSmash]
    },
    productionCost: {
      resources: {
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
    animatable: { animations: ANIM_EARTH_GOLEM_DEFINITION },
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
