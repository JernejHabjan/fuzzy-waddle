import {
  SkaduweeRangedSfxAttackSounds,
  SkaduweeRangedSfxDamageSounds,
  SkaduweeRangedSfxDeathSounds,
  SkaduweeRangedSfxEnterSounds,
  SkaduweeRangedSfxLocationSounds,
  SkaduweeRangedSfxMoveSounds,
  SkaduweeRangedSfxSelectionSounds
} from "./SkaduweeRangedSfx";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import {
  ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_1,
  ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_2,
  ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_3
} from "./skaduwee_ranged_female_anim";

export const skaduweeRangedFemaleDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.9019612560038217 }
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        {
          originalColor: 0x9fbbcb,
          epsilon: 0.1
        }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Ravenmark",
      description: "Deadly and elusive, this warrior dispatches foes before they sense danger",
      tooltipDescription: ["Long-range archer", "High damage output", "Best protected behind melee units"],
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/ranged_female.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.SkaduweeRangedBow, weaponDefinitions.SkaduweeRangedShortRange]
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 25,
        [ResourceType.Food]: 100
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    requirements: {
      actors: [ObjectNames.InfantryInn]
    },
    selectable: {},
    translatable: {
      tileMoveDuration: 500
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {
        [SoundType.Attack]: SkaduweeRangedSfxAttackSounds,
        [SoundType.Damage]: SkaduweeRangedSfxDamageSounds,
        [SoundType.Death]: SkaduweeRangedSfxDeathSounds,
        [SoundType.Select]: SkaduweeRangedSfxSelectionSounds,
        [SoundType.Move]: SkaduweeRangedSfxMoveSounds,
        [SoundType.EnterContainer]: SkaduweeRangedSfxEnterSounds,
        [SoundType.LocationUnavailable]: SkaduweeRangedSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_1 },
    level: { level: 1, maxLevel: 3 }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  },
  meta: {
    maxLevel: 3,
    levelOverrides: {
      2: {
        components: {
          health: { maxHealth: 150 },
          attack: {
            attacks: [
              { ...weaponDefinitions.SkaduweeRangedBow, damage: 6, range: 8 },
              { ...weaponDefinitions.SkaduweeRangedShortRange, damage: 4 }
            ]
          },
          animatable: { animations: ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_2 },
          level: { level: 2 }
        }
      },
      3: {
        components: {
          health: { maxHealth: 200 },
          attack: {
            attacks: [
              { ...weaponDefinitions.SkaduweeRangedBow, damage: 9, range: 9, cooldown: 1200 },
              { ...weaponDefinitions.SkaduweeRangedShortRange, damage: 6, cooldown: 800 }
            ]
          },
          animatable: { animations: ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_3 },
          level: { level: 3 }
        }
      }
    }
  }
} satisfies PrefabDefinition;
