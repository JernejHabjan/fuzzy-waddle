import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ObjectDescriptorDefinition } from "../entity/actor/components/object-descriptor-component";
import { OwnerDefinition } from "../entity/actor/components/owner-component";
import { VisionDefinition } from "../entity/actor/components/vision-component";
import { InfoDefinition } from "../entity/actor/components/info-component";
import { RequirementsDefinition } from "../entity/actor/components/requirements-component";
import { BuilderDefinition } from "../entity/actor/components/builder-component";
import { GathererDefinition } from "../entity/actor/components/gatherer-component";
import { PaymentType } from "../entity/building/payment-type";
import { AttackDefinition } from "../entity/combat/components/attack-component";
import { ActorPhysicalType, HealthDefinition } from "../entity/combat/components/health-component";
import { ProductionCostDefinition } from "../entity/building/production/production-cost-component";
import { ContainerDefinition } from "../entity/building/container-component";
import { ResourceDrainDefinition } from "../entity/economy/resource/resource-drain-component";
import { ProductionDefinition } from "../entity/building/production/production-component";
import { ColliderDefinition } from "../entity/actor/components/collider-component";
import { ResourceSourceDefinition } from "../entity/economy/resource/resource-source-component";
import { ActorTranslateDefinition } from "../entity/actor/components/actor-translate-component";
import { AiType, PawnAiDefinition } from "../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { ConstructionSiteDefinition } from "../entity/building/construction/construction-site-component";
import { HealingDefinition } from "../entity/combat/components/healing-component";
import { AudioDefinition, SoundType } from "../entity/actor/components/audio-actor-component";
import {
  TivaraMacemanSfxAttackSounds,
  TivaraMacemanSfxDamageSounds,
  TivaraMacemanSfxDeathSounds,
  TivaraMacemanSfxEnterSounds,
  TivaraMacemanSfxLocationSounds,
  TivaraMacemanSfxMoveSounds,
  TivaraMacemanSfxSelectionSounds
} from "../sfx/TivaraMacemanSfx";
import {
  TivaraWorkerFemaleSfxAttackSounds,
  TivaraWorkerFemaleSfxBuildSounds,
  TivaraWorkerFemaleSfxChopSounds,
  TivaraWorkerFemaleSfxDamageSounds,
  TivaraWorkerFemaleSfxDeathSounds,
  TivaraWorkerFemaleSfxEnterSounds,
  TivaraWorkerFemaleSfxLocationSounds,
  TivaraWorkerFemaleSfxMineSounds,
  TivaraWorkerFemaleSfxMoveSounds,
  TivaraWorkerFemaleSfxRepairSounds,
  TivaraWorkerFemaleSfxSelectionSounds
} from "../sfx/TivaraWorkerFemaleSfx";
import {
  TivaraWorkerMaleSfxAttackSounds,
  TivaraWorkerMaleSfxBuildSounds,
  TivaraWorkerMaleSfxChopSounds,
  TivaraWorkerMaleSfxDamageSounds,
  TivaraWorkerMaleSfxDeathSounds,
  TivaraWorkerMaleSfxEnterSounds,
  TivaraWorkerMaleSfxLocationSounds,
  TivaraWorkerMaleSfxMineSounds,
  TivaraWorkerMaleSfxMoveSounds,
  TivaraWorkerMaleSfxRepairSounds,
  TivaraWorkerMaleSfxSelectionExtraSounds,
  TivaraWorkerMaleSfxSelectionSounds
} from "../sfx/TivaraWorkerMaleSfx";
import {
  SkaduweeOwlSfxDamageSounds,
  SkaduweeOwlSfxDeathSounds,
  SkaduweeOwlSfxLocationSounds,
  SkaduweeOwlSfxMoveSounds,
  SkaduweeOwlSfxSelectionSounds
} from "../sfx/SkaduweeOwlSfx";
import {
  SkaduweeRangedSfxAttackSounds,
  SkaduweeRangedSfxDamageSounds,
  SkaduweeRangedSfxDeathSounds,
  SkaduweeRangedSfxEnterSounds,
  SkaduweeRangedSfxLocationSounds,
  SkaduweeRangedSfxMoveSounds,
  SkaduweeRangedSfxSelectionSounds
} from "../sfx/SkaduweeRangedSfx";
import {
  SkaduweeMagicianSfxAttackSounds,
  SkaduweeMagicianSfxDamageSounds,
  SkaduweeMagicianSfxDeathSounds,
  SkaduweeMagicianSfxEnterSounds,
  SkaduweeMagicianSfxLocationSounds,
  SkaduweeMagicianSfxMoveSounds,
  SkaduweeMagicianSfxSelectionSounds
} from "../sfx/SkaduweeMagicianSfx";
import {
  SkaduweeWarriorSfxAttackSounds,
  SkaduweeWarriorSfxDamageSounds,
  SkaduweeWarriorSfxDeathSounds,
  SkaduweeWarriorSfxEnterSounds,
  SkaduweeWarriorSfxLocationSounds,
  SkaduweeWarriorSfxMoveSounds,
  SkaduweeWarriorSfxSelectionSounds
} from "../sfx/SkaduweeWarriorSfx";
import { SelectableDefinition } from "../entity/actor/components/selectable-component";
import { ActorAnimationsDefinition } from "../entity/actor/components/animation-actor-component";
import { ANIM_TIVARA_MACEMAN_MALE_DEFINITION } from "../prefabs/characters/tivara/tivara-maceman-male/tivara_maceman_male_anims";
import { ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION } from "../prefabs/characters/skaduwee/skaduwee-ranged-female/skaduwee_ranged_female_anim";
import { ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION } from "../prefabs/characters/skaduwee/skaduwee-magician-female/skaduwee_magician_female_anim";
import { ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION } from "../prefabs/characters/skaduwee/skaduwee-warrior-male/skaduwee_warrior_male_anims";
import { ANIM_GENERAL_WARRIOR_DEFINITION } from "../prefabs/characters/general/general-warrior/warrior_anim";
import { ANIM_TIVARA_WORKER_MALE_DEFINITION } from "../prefabs/characters/tivara/tivara-worker/tivara-worker-male/tivara_worker_male_anims";
import { ANIM_TIVARA_WORKER_FEMALE_DEFINITION } from "../prefabs/characters/tivara/tivara-worker/tivara-worker-female/tivara_worker_female_anims";
import { weaponDefinitions } from "../entity/combat/attack-data";
import { ANIM_SKADUWEE_OWL_DEFINITION } from "../prefabs/units/skaduwee/SkaduweeOwlAnims";
import { RepresentableDefinition } from "../entity/actor/components/representable-component";
import { FlightDefinition } from "../entity/actor/components/flight-component";
import { WalkableDefinition } from "../entity/actor/components/walkable-component";
import { ANIM_BOAR_DEFINITION } from "../prefabs/animals/boar/anims-boar";
import { ANIM_STAG_DEFINITION } from "../prefabs/animals/stag/anims-stag";
import { ANIM_WOLF_DEFINITION } from "../prefabs/animals/wolf/anims-wolf";
import {
  ActorsStoneSfxOutOfResourcesSounds,
  ActorsStoneSfxSelectionSounds
} from "../prefabs/outside/resources/stone-pile/sfx-stone";
import {
  ActorsTreeSfxResourceDepletedSounds,
  ActorsTreeSfxSelectionSounds
} from "../prefabs/outside/foliage/trees/resources/sfx-tree";
import { ActorsMineralsSfxSelectionSounds } from "../prefabs/outside/resources/minerals/sfx-minerals";
import { tivaraWorkerDefinition } from "../prefabs/characters/tivara/tivara-worker/tivara-worker.definition";
import { skaduweeWorkerDefinition } from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker.definition";
import { skaduweeWorkerMaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-male/skaduwee-worker-male.definition";
import { skaduweeWorkerFemaleDefinition } from "../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-female/skaduwee-worker-female.definition";
import { frostForgeDefinition } from "../prefabs/buildings/skaduwee/FrostForge/frost-forge.definition";
import { infantryInnDefinition } from "../prefabs/buildings/skaduwee/InfantryInn/infantry-inn.definition";
import { wallDefinition } from "../prefabs/buildings/tivara/wall/wall.definition";
import { watchTowerDefinition } from "../prefabs/buildings/tivara/WatchTower/watch-tower.definition";
import { stairsDefinition } from "../prefabs/buildings/tivara/stairs/stairs.definition";
import { ankGuardDefinition } from "../prefabs/buildings/tivara/AnkGuard/ank-guard.definition";
import { olivalDefinition } from "../prefabs/buildings/tivara/Olival/olival.definition";
import { sandholdDefinition } from "../prefabs/buildings/tivara/Sandhold/sandhold.definition";
import { templeDefinition } from "../prefabs/buildings/tivara/Temple/temple.definition";
import { workMillDefinition } from "../prefabs/buildings/tivara/WorkMill/work-mill.definition";
import { owleryDefinition } from "../prefabs/buildings/skaduwee/Owlery/owlery.definition";
import { hedgehogDefinition } from "../prefabs/animals/hedgehog/hedgehog.definition";
import { sheepDefinition } from "../prefabs/animals/sheep/sheep.definition";
import { badgerDefinition } from "../prefabs/animals/badger/badger.definition";
import { tivaraSlingshotFemaleDefinition } from "../prefabs/characters/tivara/tivara-slingshot-female/tivara-slingshot-female.definition";

const treeDefinitions: PrefabDefinition = {
  components: {
    objectDescriptor: {
      color: 0xbea55b
    },
    collider: {
      enabled: true,
      colliderFactorReduction: 0.5
    },
    selectable: {},
    resourceSource: {
      resourceType: ResourceType.Wood,
      maximumResources: 20,
      gatheringFactor: 1
    },
    audio: {
      sounds: {
        [SoundType.Select]: ActorsTreeSfxSelectionSounds,
        ["depleted"]: ActorsTreeSfxResourceDepletedSounds
      }
    }
  }
};

export type PrefabDefinition = Partial<{
  components: Partial<{
    objectDescriptor: ObjectDescriptorDefinition;
    representable: RepresentableDefinition;
    owner: OwnerDefinition;
    vision: VisionDefinition;
    info: InfoDefinition;
    health: HealthDefinition;
    attack: AttackDefinition;
    productionCost: ProductionCostDefinition;
    requirements: RequirementsDefinition;
    builder: BuilderDefinition;
    constructable: ConstructionSiteDefinition;
    walkable: WalkableDefinition;
    gatherer: GathererDefinition;
    container: ContainerDefinition;
    resourceDrain: ResourceDrainDefinition;
    resourceSource: ResourceSourceDefinition;
    production: ProductionDefinition;
    healing: HealingDefinition;
    translatable: ActorTranslateDefinition;
    flying: FlightDefinition;
    animatable: ActorAnimationsDefinition;
    aiControlled: PawnAiDefinition;
    containable: { enabled: boolean };
    selectable: SelectableDefinition;
    collider: ColliderDefinition;
    audio: AudioDefinition;
  }>;
  systems: Partial<{
    movement: {
      enabled: boolean;
    };
    action: {
      enabled: boolean;
    };
  }>;
  meta: Partial<{
    randomOfType: ObjectNames[];
  }>;
}>;
export const pwActorDefinitions: {
  [key in ObjectNames]: PrefabDefinition;
} = {
  Hedgehog: hedgehogDefinition,
  Sheep: sheepDefinition,
  Badger: badgerDefinition,
  Boar: {
    components: {
      representable: {
        width: 46,
        height: 32
      },
      objectDescriptor: {
        color: 0x222e37
      },
      translatable: {
        tileMoveDuration: 400
      },
      audio: {
        sounds: {
          // todo
        }
      },
      animatable: { animations: ANIM_BOAR_DEFINITION }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  Stag: {
    components: {
      representable: {
        width: 32,
        height: 41
      },
      objectDescriptor: {
        color: 0xc75841
      },
      translatable: {
        tileMoveDuration: 800
      },
      audio: {
        sounds: {
          // todo
        }
      },
      animatable: { animations: ANIM_STAG_DEFINITION }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  Wolf: {
    components: {
      representable: {
        width: 64,
        height: 64
      },
      objectDescriptor: {
        color: 0x3b4a50
      },
      vision: {
        range: 10
      },
      info: {
        name: "Grey Wolf",
        description: "(critter) A grey wolf",
        smallImage: {
          key: "animals_2",
          frame: "wolf/idle/se/04.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Biological,
        maxHealth: 100
      },
      translatable: {
        tileMoveDuration: 300
      },
      audio: {
        sounds: {
          // todo
        }
      },
      animatable: { animations: ANIM_WOLF_DEFINITION },
      attack: {
        attacks: [weaponDefinitions.wolfBite]
      }
    },
    systems: {
      movement: { enabled: true }
    }
  },

  GeneralWarrior: {
    components: {
      representable: {
        width: 64,
        height: 64
      },
      objectDescriptor: {
        color: 0x75502d
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
        range: 10
      },
      info: {
        name: "Bandit",
        description: "A hardened rogue, quick with a blade and quicker to cause trouble",
        smallImage: {
          key: "factions",
          frame: "character_icons/general/warrior.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Biological,
        maxHealth: 100
      },
      attack: {
        attacks: [weaponDefinitions.spear]
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
      selectable: {},
      translatable: {
        tileMoveDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      },
      animatable: { animations: ANIM_GENERAL_WARRIOR_DEFINITION }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  TivaraMacemanMale: {
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
  },
  TivaraSlingshotFemale: tivaraSlingshotFemaleDefinition,
  TivaraWorker: tivaraWorkerDefinition,
  TivaraWorkerFemale: {
    ...tivaraWorkerDefinition,
    components: {
      ...tivaraWorkerDefinition.components,
      info: {
        name: "Dustbound",
        description: "Bound by ancient decree, they labor in the sand to honor what once was — and what must return",
        smallImage: {
          key: "factions",
          frame: "character_icons/tivara/worker_female.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      audio: {
        sounds: {
          [SoundType.Attack]: TivaraWorkerFemaleSfxAttackSounds,
          [SoundType.Damage]: TivaraWorkerFemaleSfxDamageSounds,
          [SoundType.Death]: TivaraWorkerFemaleSfxDeathSounds,
          [SoundType.Select]: TivaraWorkerFemaleSfxSelectionSounds,
          [SoundType.Move]: TivaraWorkerFemaleSfxMoveSounds,
          [SoundType.EnterContainer]: TivaraWorkerFemaleSfxEnterSounds,
          [SoundType.LocationUnavailable]: TivaraWorkerFemaleSfxLocationSounds,
          [SoundType.Repair]: TivaraWorkerFemaleSfxRepairSounds,
          [SoundType.Heal]: TivaraWorkerFemaleSfxRepairSounds,
          [SoundType.Build]: TivaraWorkerFemaleSfxBuildSounds,
          [SoundType.Chop]: TivaraWorkerFemaleSfxChopSounds,
          [SoundType.Mine]: TivaraWorkerFemaleSfxMineSounds
        }
      },
      animatable: { animations: ANIM_TIVARA_WORKER_FEMALE_DEFINITION }
    }
  },
  TivaraWorkerMale: {
    ...tivaraWorkerDefinition,
    components: {
      ...tivaraWorkerDefinition.components,
      info: {
        name: "Sandward",
        description: "From ruin to rise again — their toil feeds the endless rhythm etched in stone and soul",
        smallImage: {
          key: "factions",
          frame: "character_icons/tivara/worker_male.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      audio: {
        sounds: {
          [SoundType.Attack]: TivaraWorkerMaleSfxAttackSounds,
          [SoundType.Damage]: TivaraWorkerMaleSfxDamageSounds,
          [SoundType.Death]: TivaraWorkerMaleSfxDeathSounds,
          [SoundType.Select]: TivaraWorkerMaleSfxSelectionSounds,
          [SoundType.SelectExtra]: TivaraWorkerMaleSfxSelectionExtraSounds,
          [SoundType.Move]: TivaraWorkerMaleSfxMoveSounds,
          [SoundType.EnterContainer]: TivaraWorkerMaleSfxEnterSounds,
          [SoundType.LocationUnavailable]: TivaraWorkerMaleSfxLocationSounds,
          [SoundType.Repair]: TivaraWorkerMaleSfxRepairSounds,
          [SoundType.Heal]: TivaraWorkerMaleSfxRepairSounds,
          [SoundType.Build]: TivaraWorkerMaleSfxBuildSounds,
          [SoundType.Chop]: TivaraWorkerMaleSfxChopSounds,
          [SoundType.Mine]: TivaraWorkerMaleSfxMineSounds
        }
      },
      animatable: { animations: ANIM_TIVARA_WORKER_MALE_DEFINITION }
    }
  },
  AnkGuard: ankGuardDefinition,
  Olival: olivalDefinition,
  Sandhold: sandholdDefinition,
  Temple: templeDefinition,
  WorkMill: workMillDefinition,
  SkaduweeOwl: {
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
  },
  SkaduweeRangedFemale: {
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
  },
  SkaduweeMagicianFemale: {
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
        description:
          "A conduit of shadow and void, this sorcerer commands dark energies that consume all light and hope",
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
  },
  SkaduweeWarriorMale: {
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
        maxHealth: 100
      },
      attack: {
        attacks: [weaponDefinitions.axe]
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
  },
  SkaduweeWorkerMale: skaduweeWorkerMaleDefinition,
  SkaduweeWorker: skaduweeWorkerDefinition,
  SkaduweeWorkerFemale: skaduweeWorkerFemaleDefinition,
  FrostForge: frostForgeDefinition,
  InfantryInn: infantryInnDefinition,
  Owlery: owleryDefinition,
  Tree1: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 40
      },
      representable: {
        width: 128,
        height: 384
      }
    }
  },
  Tree4: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 40
      },
      representable: {
        width: 128,
        height: 256
      }
    }
  },
  Tree5: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 60
      },
      representable: {
        width: 128,
        height: 256
      }
    }
  },
  Tree6: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 60
      },
      representable: {
        width: 128,
        height: 384
      }
    }
  },
  Tree7: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 60
      },
      representable: {
        width: 128,
        height: 256
      }
    }
  },
  Tree9: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 120
      },
      representable: {
        width: 256,
        height: 384
      }
    }
  },
  Tree10: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 50
      },
      representable: {
        width: 184,
        height: 184
      }
    }
  },
  Tree11: {
    ...treeDefinitions,
    components: {
      ...treeDefinitions.components,
      resourceSource: {
        ...treeDefinitions.components!.resourceSource!,
        maximumResources: 80
      },
      representable: {
        width: 184,
        height: 184
      }
    }
  },
  Stairs: stairsDefinition,
  WatchTower: watchTowerDefinition,
  Wall: wallDefinition,
  Minerals: {
    components: {
      representable: {
        width: 64,
        height: 64
      },
      objectDescriptor: {
        color: 0xbea55b
      },
      collider: {
        enabled: true
      },
      selectable: { offsetY: 16 },
      resourceSource: {
        resourceType: ResourceType.Minerals,
        maximumResources: 100,
        gatheringFactor: 1
      },
      audio: {
        sounds: {
          [SoundType.Select]: ActorsMineralsSfxSelectionSounds,
          ["depleted"]: ActorsStoneSfxOutOfResourcesSounds
        }
      }
    }
  },
  StonePile: {
    components: {
      representable: {
        width: 64,
        height: 64
      },
      objectDescriptor: {
        color: 0xbea55b
      },
      collider: {
        enabled: true
      },
      selectable: { offsetY: 16 },
      resourceSource: {
        resourceType: ResourceType.Stone,
        maximumResources: 100,
        gatheringFactor: 1
      },
      audio: {
        sounds: {
          [SoundType.Select]: ActorsStoneSfxSelectionSounds,
          ["depleted"]: ActorsStoneSfxOutOfResourcesSounds
        }
      }
    }
  }
};
