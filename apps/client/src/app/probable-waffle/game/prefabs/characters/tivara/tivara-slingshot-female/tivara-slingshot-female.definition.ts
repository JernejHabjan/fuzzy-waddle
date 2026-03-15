import {
  TivaraSlingshotSfxAttackSounds,
  TivaraSlingshotSfxDamageSounds,
  TivaraSlingshotSfxDeathSounds,
  TivaraSlingshotSfxEnterSounds,
  TivaraSlingshotSfxLocationSounds,
  TivaraSlingshotSfxMoveSounds,
  TivaraSlingshotSfxSelectionSounds
} from "./TivaraSlingshotSfx";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { ANIM_TIVARA_MACEMAN_MALE_DEFINITION_LEVEL_1 } from "./tivara_slingshot_female_anims";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";
import { SpellType } from "../../../../entity/components/combat/spell-type";

export const tivaraSlingshotFemaleDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.8995955734617012 }
    },
    objectDescriptor: {
      color: 0xc2a080
    },
    owner: {
      color: [
        {
          originalColor: 0x31770f,
          epsilon: 0.25
        }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Cursed Banshee",
      description: "A silent stalker armed with ancient curses and deadly precision",
      tooltipDescription: ["Ranged attacker", "Effective against light units", "Vulnerable in melee combat"],
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/slingshot_female.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.TivaraSlingshot, weaponDefinitions.TivaraSlingshotShortRange]
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 25,
        [ResourceType.Minerals]: 120
      },
      refundFactor: 0.5,
      productionTime: 10000,
      costType: PaymentType.PayImmediately
    },
    housingCost: {
      housingNeeded: 1
    },
    requirements: {
      actors: [ObjectNames.Temple]
    },
    spell: {
      availableSpells: [SpellType.Firestorm, SpellType.FrostNova, SpellType.HealingRain]
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
        [SoundType.Attack]: TivaraSlingshotSfxAttackSounds,
        [SoundType.Damage]: TivaraSlingshotSfxDamageSounds,
        [SoundType.Death]: TivaraSlingshotSfxDeathSounds,
        [SoundType.Select]: TivaraSlingshotSfxSelectionSounds,
        [SoundType.Move]: TivaraSlingshotSfxMoveSounds,
        [SoundType.EnterContainer]: TivaraSlingshotSfxEnterSounds,
        [SoundType.LocationUnavailable]: TivaraSlingshotSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_TIVARA_MACEMAN_MALE_DEFINITION_LEVEL_1 }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
