import { ANIM_FLOWER_MONSTER_DEFINITION } from "./anims-flower_monster";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";
import { coreConstructionSiteDefinition } from "../../../buildings/shared/core-construction-site.definition";

export const flowerMonsterDefinition = {
  components: {
    representable: {
      width: 48,
      height: 72,
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
      name: "Flower Monster",
      description:
        "A rooted carnivorous plant that crushes nearby enemies and spits poisonous seeds at distant targets.",
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
      attacks: [weaponDefinitions.FlowerStomp, weaponDefinitions.FlowerSpit]
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
    animatable: { animations: ANIM_FLOWER_MONSTER_DEFINITION },
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
