import {
  SkaduweeRangedSfxAttackSounds,
  SkaduweeRangedSfxDamageSounds,
  SkaduweeRangedSfxDeathSounds,
  SkaduweeRangedSfxEnterSounds,
  SkaduweeRangedSfxLocationSounds,
  SkaduweeRangedSfxMoveSounds,
  SkaduweeRangedSfxSelectionSounds
} from "./SkaduweeRangedSfx";
import { weaponDefinitions } from "../../../../entity/components/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/pawn-ai-controller";
import { ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION } from "./skaduwee_ranged_female_anim";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const skaduweeRangedFemaleDefinition = {
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
      attacks: [weaponDefinitions.bow]
    },
    productionCost: {
      resources: {
        [ResourceType.Wood]: 10,
        [ResourceType.Minerals]: 10
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
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
    animatable: { animations: ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
