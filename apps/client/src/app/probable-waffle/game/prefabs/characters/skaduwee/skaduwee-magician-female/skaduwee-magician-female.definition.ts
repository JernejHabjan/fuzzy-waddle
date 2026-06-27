import {
  SkaduweeMagicianSfxAttackSounds,
  SkaduweeMagicianSfxDamageSounds,
  SkaduweeMagicianSfxDeathSounds,
  SkaduweeMagicianSfxEnterSounds,
  SkaduweeMagicianSfxLocationSounds,
  SkaduweeMagicianSfxMoveSounds,
  SkaduweeMagicianSfxSelectionSounds
} from "./SkaduweeMagicianSfx";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import {
  ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_1,
  ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_2,
  ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_3
} from "./skaduwee_magician_female_anim";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import { SpellType } from "../../../../entity/components/combat/spell-type";

export const skaduweeMagicianFemaleDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        { originalColor: 0x9fbbcb, epsilon: 0.15 },
        { originalColor: 0xc6eefd, epsilon: 0.15 },
        { originalColor: 0xffffff, epsilon: 0.05 }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Umbramancer",
      description: "A conduit of shadow and void, this sorcerer commands dark energies that consume all light and hope",
      tooltipDescription: ["Ranged magic attacker", "Deals elemental fire damage", "Fragile but powerful"],
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/magician_female.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 50
    },
    attack: {
      attacks: [weaponDefinitions.FrostSpell, weaponDefinitions.SkaduweeMagicianStaff]
    },
    spell: {
      availableSpells: [SpellType.Snowstorm, SpellType.HealingTotem, SpellType.HealingLight]
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 25,
        [ResourceType.Food]: 120
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
        [SoundType.Attack]: SkaduweeMagicianSfxAttackSounds,
        [SoundType.Damage]: SkaduweeMagicianSfxDamageSounds,
        [SoundType.Death]: SkaduweeMagicianSfxDeathSounds,
        [SoundType.Select]: SkaduweeMagicianSfxSelectionSounds,
        [SoundType.Move]: SkaduweeMagicianSfxMoveSounds,
        [SoundType.EnterContainer]: SkaduweeMagicianSfxEnterSounds,
        [SoundType.LocationUnavailable]: SkaduweeMagicianSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_1 },
    level: { level: 1, maxLevel: 3 }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true },
    spellCasting: { enabled: true }
  },
  meta: {
    maxLevel: 3,
    levelOverrides: {
      2: {
        components: {
          health: { maxHealth: 75 },
          attack: {
            attacks: [
              { ...weaponDefinitions.FrostSpell, damage: 10, range: 7 },
              { ...weaponDefinitions.SkaduweeMagicianStaff, damage: 4 }
            ]
          },
          animatable: { animations: ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_2 },
          level: { level: 2 }
        }
      },
      3: {
        components: {
          health: { maxHealth: 100 },
          attack: {
            attacks: [
              { ...weaponDefinitions.FrostSpell, damage: 14, range: 8, cooldown: 1800 },
              { ...weaponDefinitions.SkaduweeMagicianStaff, damage: 6, range: 3 }
            ]
          },
          animatable: { animations: ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_3 },
          level: { level: 3 }
        }
      }
    }
  }
} satisfies PrefabDefinition;
