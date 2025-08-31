import { PrefabDefinition } from "../../../../data/actor-definitions";
import {
  SkaduweeOwlSfxDamageSounds,
  SkaduweeOwlSfxDeathSounds,
  SkaduweeOwlSfxLocationSounds,
  SkaduweeOwlSfxMoveSounds,
  SkaduweeOwlSfxSelectionSounds
} from "../../../../sfx/SkaduweeOwlSfx";
import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { weaponDefinitions } from "../../../../entity/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { AiType } from "../../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { SoundType } from "../../../../entity/actor/components/audio-actor-component";
import { ANIM_SKADUWEE_OWL_DEFINITION } from "./SkaduweeOwlAnims";

export const skaduweeOwlDefinition = {
  components: {
    representable: {
      width: 32,
      height: 32
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
      smallImage: {
        key: "factions",
        frame: "character_icons/skaduwee/owl.png",
        origin: { x: 0.5, y: 0.5 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.furball]
    },
    selectable: {},
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
      actors: [ObjectNames.Owlery]
    },
    translatable: {
      tileMoveDuration: 2000
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
