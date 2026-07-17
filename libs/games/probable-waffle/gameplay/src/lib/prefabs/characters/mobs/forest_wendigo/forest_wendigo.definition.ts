import { ANIM_FOREST_WENDIGO_DEFINITION } from "./anims-forest_wendigo";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { SpellType } from "../../../../entity/components/combat/spell-type";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/ai-type";

export const wendigoDefinition = {
  components: {
    representable: {
      width: 64,
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
    health: {
      physicalState: ActorPhysicalType.Biological, // todo not really
      maxHealth: 200
    },
    attack: {
      attacks: [weaponDefinitions.WendigoSlash]
    },
    spell: {
      availableSpells: [SpellType.WendigoBranches, SpellType.WendigoStomp]
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
      tileMoveDuration: 600
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
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

export const forestWendigoDefinition = {
  ...wendigoDefinition,
  components: {
    ...wendigoDefinition.components,
    info: {
      name: "Forest Wendigo",
      description:
        "A savage predator of the ancient forests that tears through enemies with brutal strength and the fury of nature.",
      smallImage: {
        key: "factions",
        frame: "probable-waffle/spritesheets/characters/general/centurion/centurion_idle.png", // todo
        origin: { x: 0.5, y: 0.6 }
      }
    },
    animatable: { animations: ANIM_FOREST_WENDIGO_DEFINITION }
  }
} satisfies PrefabDefinition;
