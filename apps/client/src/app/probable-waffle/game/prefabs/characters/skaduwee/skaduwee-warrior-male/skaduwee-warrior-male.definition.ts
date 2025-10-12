import {
  SkaduweeWarriorSfxAttackSounds,
  SkaduweeWarriorSfxDamageSounds,
  SkaduweeWarriorSfxDeathSounds,
  SkaduweeWarriorSfxEnterSounds,
  SkaduweeWarriorSfxLocationSounds,
  SkaduweeWarriorSfxMoveSounds,
  SkaduweeWarriorSfxSelectionSounds
} from "./SkaduweeWarriorSfx";
import { weaponDefinitions } from "../../../../entity/components/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/pawn-ai-controller";
import { ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION } from "./skaduwee_warrior_male_anims";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const skaduweeWarriorMaleDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64
    },
    objectDescriptor: {
      color: 0xf2f7fa
    },
    owner: {
      color: [
        {
          originalColor: 0x867e7f,
          epsilon: 0.2
        }
      ]
    },
    vision: {
      range: 10
    },
    info: {
      name: "Garruk",
      description: "Unyielding and fierce, he brings ruin to all who oppose him",
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/warrior_male.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 150
    },
    attack: {
      attacks: [weaponDefinitions.axe]
    },
    productionCost: {
      resources: {
        [ResourceType.Minerals]: 100
      },
      refundFactor: 0.5,
      productionTime: 5000,
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
        [SoundType.Attack]: SkaduweeWarriorSfxAttackSounds,
        [SoundType.Damage]: SkaduweeWarriorSfxDamageSounds,
        [SoundType.Death]: SkaduweeWarriorSfxDeathSounds,
        [SoundType.Select]: SkaduweeWarriorSfxSelectionSounds,
        [SoundType.Move]: SkaduweeWarriorSfxMoveSounds,
        [SoundType.EnterContainer]: SkaduweeWarriorSfxEnterSounds,
        [SoundType.LocationUnavailable]: SkaduweeWarriorSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
