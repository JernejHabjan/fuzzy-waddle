import {
  SkaduweeMagicianSfxAttackSounds,
  SkaduweeMagicianSfxDamageSounds,
  SkaduweeMagicianSfxDeathSounds,
  SkaduweeMagicianSfxEnterSounds,
  SkaduweeMagicianSfxLocationSounds,
  SkaduweeMagicianSfxMoveSounds,
  SkaduweeMagicianSfxSelectionSounds
} from "./SkaduweeMagicianSfx";
import { weaponDefinitions } from "../../../../entity/components/combat/attack-data";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/components/production/payment-type";
import { AiType } from "../../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION } from "./skaduwee_magician_female_anim";
import type { PrefabDefinition } from "../../../definitions/prefab-definition";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
import { ActorPhysicalType } from "../../../../entity/components/combat/components/actor-physical-type";

export const skaduweeMagicianFemaleDefinition = {
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
      attacks: [weaponDefinitions.fireSpell, weaponDefinitions.staff]
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
        [SoundType.Attack]: SkaduweeMagicianSfxAttackSounds,
        [SoundType.Damage]: SkaduweeMagicianSfxDamageSounds,
        [SoundType.Death]: SkaduweeMagicianSfxDeathSounds,
        [SoundType.Select]: SkaduweeMagicianSfxSelectionSounds,
        [SoundType.Move]: SkaduweeMagicianSfxMoveSounds,
        [SoundType.EnterContainer]: SkaduweeMagicianSfxEnterSounds,
        [SoundType.LocationUnavailable]: SkaduweeMagicianSfxLocationSounds
      }
    },
    animatable: { animations: ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
} satisfies PrefabDefinition;
