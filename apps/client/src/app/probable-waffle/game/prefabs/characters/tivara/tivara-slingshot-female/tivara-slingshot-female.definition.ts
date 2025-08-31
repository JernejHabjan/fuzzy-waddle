import type { PrefabDefinition } from "../../../../data/actor-definitions";
import {
  TivaraSlingshotSfxAttackSounds,
  TivaraSlingshotSfxDamageSounds,
  TivaraSlingshotSfxDeathSounds,
  TivaraSlingshotSfxEnterSounds,
  TivaraSlingshotSfxLocationSounds,
  TivaraSlingshotSfxMoveSounds,
  TivaraSlingshotSfxSelectionSounds
} from "../../../../sfx/TivaraSlingshotSfx";
import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { weaponDefinitions } from "../../../../entity/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { AiType } from "../../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { SoundType } from "../../../../entity/actor/components/audio-actor-component";
import { ANIM_TIVARA_SLINGSHOT_FEMALE_DEFINITION } from "./tivara_slingshot_female_anims";

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
        [ResourceType.Wood]: 10,
        [ResourceType.Minerals]: 10
      },
      refundFactor: 0.5,
      productionTime: 5000,
      costType: PaymentType.PayImmediately
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
