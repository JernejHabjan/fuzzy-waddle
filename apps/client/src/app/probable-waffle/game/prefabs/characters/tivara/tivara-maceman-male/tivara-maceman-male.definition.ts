import { ActorPhysicalType } from "../../../../entity/combat/components/health-component";
import { weaponDefinitions } from "../../../../entity/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { AiType } from "../../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { SoundType } from "../../../../entity/actor/components/audio-actor-component";
import {
  TivaraMacemanSfxAttackSounds,
  TivaraMacemanSfxDamageSounds,
  TivaraMacemanSfxDeathSounds,
  TivaraMacemanSfxEnterSounds,
  TivaraMacemanSfxLocationSounds,
  TivaraMacemanSfxMoveSounds,
  TivaraMacemanSfxSelectionSounds
} from "./TivaraMacemanSfx";
import { ANIM_TIVARA_MACEMAN_MALE_DEFINITION } from "./tivara_maceman_male_anims";
import type { PrefabDefinition } from "../../../../data/prefab-definition";

export const tivaraMacemanMaleDefinition = {
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
      name: "Anubian Mauler",
      description:
        "Cursed warrior in ritual armor, wielding mace and shield to spread plague in service of Tivara’s dark will",
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/maceman_male.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.mace]
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
        [SoundType.Attack]: TivaraMacemanSfxAttackSounds,
        [SoundType.Damage]: TivaraMacemanSfxDamageSounds,
        [SoundType.Death]: TivaraMacemanSfxDeathSounds,
        [SoundType.Select]: TivaraMacemanSfxSelectionSounds,
        [SoundType.Move]: TivaraMacemanSfxMoveSounds,
        [SoundType.EnterContainer]: TivaraMacemanSfxEnterSounds,
        [SoundType.LocationUnavailable]: TivaraMacemanSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_TIVARA_MACEMAN_MALE_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
