import {
  TivaraSlingshotSfxAttackSounds,
  TivaraSlingshotSfxDamageSounds,
  TivaraSlingshotSfxDeathSounds,
  TivaraSlingshotSfxEnterSounds,
  TivaraSlingshotSfxLocationSounds,
  TivaraSlingshotSfxMoveSounds,
  TivaraSlingshotSfxSelectionSounds
} from "./TivaraSlingshotSfx";
import { weaponDefinitions } from "../../../../entity/components/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../ai-agents/pawn-ai-controller";
import { ANIM_TIVARA_SLINGSHOT_FEMALE_DEFINITION } from "./tivara_slingshot_female_anims";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const tivaraSlingshotFemaleDefinition = {
  components: {
    representable: {
      width: 64,
      height: 64
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
      attacks: [weaponDefinitions.slingshot]
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
      actors: [ObjectNames.AnkGuard]
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
    animatable: { animations: ANIM_TIVARA_SLINGSHOT_FEMALE_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
