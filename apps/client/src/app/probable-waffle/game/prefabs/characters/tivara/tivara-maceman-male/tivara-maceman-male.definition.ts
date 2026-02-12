import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
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
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";
import { weaponDefinitions } from "../../../../entity/components/combat/weapon-definitions";
import { AiType } from "../../../ai-agents/ai-type";

export const tivaraMacemanMaleDefinition = {
  components: {
    representable: {
      width: 32,
      height: 48,
      origin: { x: 0.5, y: 0.899286430676403 }
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
        "Cursed warrior in ritual armor, wielding mace and shield to spread plague in service of Tivara's dark will",
      tooltipDescription: ["Strong melee fighter", "Highly durable frontline unit", "Effective against structures"],
      smallImage: {
        key: "factions",
        frame: "character_icons/tivara/maceman_male.png",
        origin: { x: 0.5, y: 0.6 }
      }
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 150
    },
    attack: {
      attacks: [weaponDefinitions.TivaraMace]
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
