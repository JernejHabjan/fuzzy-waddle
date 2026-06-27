import {
  SkaduweeOwlSfxDamageSounds,
  SkaduweeOwlSfxDeathSounds,
  SkaduweeOwlSfxLocationSounds,
  SkaduweeOwlSfxMoveSounds,
  SkaduweeOwlSfxSelectionSounds
} from "./SkaduweeOwlSfx";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { ANIM_SKADUWEE_OWL_DEFINITION } from "./SkaduweeOwlAnims";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";

export const skaduweeOwlDefinition = {
  components: {
    representable: {
      width: 48,
      height: 48,
      origin: { x: 0.5, y: 0.5 }
    },
    objectDescriptor: {
      color: 0xe9ecf2
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
      range: 14
    },
    info: {
      name: "Mirk",
      description: "A tiny harbinger of decay, this swift flyer unleashes toxic venom that corrupts all it touches",
      tooltipDescription: ["Fast flying unit", "Can attack ground targets", "Good for scouting and harassment"],
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/owl.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 80
    },
    attack: {
      attacks: [weaponDefinitions.Furball]
    },
    selectable: {},
    productionCost: {
      resources: {
        [ResourceType.Stone]: 40,
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
      actors: [ObjectNames.Owlery]
    },
    translatable: {
      tileMoveDuration: 300
    },
    flying: {
      height: 128
    },
    aiControlled: {
      type: AiType.Character
    },
    audio: {
      sounds: {
        [SoundType.Attack]: SkaduweeOwlSfxSelectionSounds,
        [SoundType.Damage]: SkaduweeOwlSfxDamageSounds,
        [SoundType.Death]: SkaduweeOwlSfxDeathSounds,
        [SoundType.Select]: SkaduweeOwlSfxSelectionSounds,
        [SoundType.Move]: SkaduweeOwlSfxMoveSounds,
        [SoundType.LocationUnavailable]: SkaduweeOwlSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_OWL_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
