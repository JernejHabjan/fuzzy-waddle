import { ANIM_SAND_WORM_DEFINITION } from "./anims-sand_worm";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";
import { coreConstructionSiteDefinition } from "../../../buildings/shared/core-construction-site.definition";

export const sandWormDefinition = {
  components: {
    representable: {
      width: 48,
      height: 96,
      origin: { x: 0.5, y: 0.9 }
    },
    objectDescriptor: {
      color: 0x774776
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
      range: 13
    },
    info: {
      name: "Sand Worm",
      description:
        "A colossal burrowing predator that bites nearby enemies and spits corrosive acid at distant targets.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 800,
      healthDisplayBehavior: "onDamage"
    },
    attack: {
      attacks: [weaponDefinitions.SandWormBite, weaponDefinitions.SandWormShootAcid]
    },
    productionCost: {
      resources: {
        [ResourceType.Food]: 140,
        [ResourceType.Minerals]: 100
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    collider: { enabled: true },
    selectable: {},
    aiControlled: {
      type: AiType.Character // TODO DOESNT WORK - maybe use different ai type or reuse same for all? dunno
    },
    constructable: {
      ...coreConstructionSiteDefinition
    },
    animatable: { animations: ANIM_SAND_WORM_DEFINITION },
    audio: {
      sounds: {
        // todo
      }
    }
  },
  systems: {
    // movement: { enabled: false }, // not movable
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
