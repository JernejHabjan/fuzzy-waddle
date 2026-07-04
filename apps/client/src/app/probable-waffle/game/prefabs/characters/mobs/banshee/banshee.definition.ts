import { ANIM_BANSHEE_DEFINITION } from "./anims-banshee";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";
import { SpellType } from "../../../../entity/components/combat/spell-type";

export const bansheeDefinition = {
  components: {
    representable: {
      width: 60,
      height: 80,
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
      name: "Banshee",
      description: "A haunting spirit that wields dark magic to harass enemies and support allied forces.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological, // todo not really
      maxHealth: 200
    },
    attack: {
      attacks: [weaponDefinitions.BansheeSlash]
    },
    spell: {
      availableSpells: [SpellType.BansheeTeleport, SpellType.BansheeScream]
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
    housingCost: {
      housingNeeded: 3
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 200
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    animatable: { animations: ANIM_BANSHEE_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
