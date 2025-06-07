import { ObjectNames } from "./object-names";
import { ObjectDescriptorDefinition } from "../entity/actor/components/object-descriptor-component";
import { OwnerDefinition } from "../entity/actor/components/owner-component";
import { VisionDefinition } from "../entity/actor/components/vision-component";
import { InfoDefinition } from "../entity/actor/components/info-component";
import { RequirementsDefinition } from "../entity/actor/components/requirements-component";
import { BuilderDefinition } from "../entity/actor/components/builder-component";
import { GathererDefinition } from "../entity/actor/components/gatherer-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../entity/building/payment-type";
import { AttackDefinition } from "../entity/combat/components/attack-component";
import { ActorPhysicalType, HealthDefinition } from "../entity/combat/components/health-component";
import { ProductionCostDefinition } from "../entity/building/production/production-cost-component";
import {
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_FROST_FORGE,
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN,
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION,
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_IDLE,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_IDLE
} from "../prefabs/gui/icon-animations";
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
  ActorsHedgehogSfxAngrySounds,
  ActorsHedgehogSfxSelectionSounds,
  ActorsSheepSfxBleatSounds,
  ActorsSheepSfxScissorsSounds,
  ActorsSheepSfxWoolBombSounds
} from "../sfx/ActorsAnimalsSfx";
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
  TivaraSlingshotSfxAttackSounds,
  TivaraSlingshotSfxDamageSounds,
  TivaraSlingshotSfxDeathSounds,
  TivaraSlingshotSfxEnterSounds,
  TivaraSlingshotSfxLocationSounds,
  TivaraSlingshotSfxMoveSounds,
  TivaraSlingshotSfxSelectionSounds
} from "../sfx/TivaraSlingshotSfx";
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
import {
  SkaduweeWorkerFemaleSfxAttackSounds,
  SkaduweeWorkerFemaleSfxBuildSounds,
  SkaduweeWorkerFemaleSfxChopSounds,
  SkaduweeWorkerFemaleSfxDamageSounds,
  SkaduweeWorkerFemaleSfxDeathSounds,
  SkaduweeWorkerFemaleSfxEnterSounds,
  SkaduweeWorkerFemaleSfxLocationSounds,
  SkaduweeWorkerFemaleSfxMineSounds,
  SkaduweeWorkerFemaleSfxMoveSounds,
  SkaduweeWorkerFemaleSfxRepairSounds,
  SkaduweeWorkerFemaleSfxSelectSounds
} from "../sfx/SkaduweeWorkerFemaleSfx";
import {
  SkaduweeWorkerMaleSfxAttackSounds,
  SkaduweeWorkerMaleSfxBuildSounds,
  SkaduweeWorkerMaleSfxChopSounds,
  SkaduweeWorkerMaleSfxDamageSounds,
  SkaduweeWorkerMaleSfxDeathSounds,
  SkaduweeWorkerMaleSfxEnterSounds,
  SkaduweeWorkerMaleSfxLocationSounds,
  SkaduweeWorkerMaleSfxMineSounds,
  SkaduweeWorkerMaleSfxMoveSounds,
  SkaduweeWorkerMaleSfxRepairSounds,
  SkaduweeWorkerMaleSfxSelectionSounds
} from "../sfx/SkaduweeWorkerMaleSfx";
import {
  ActorsMineralsSfxSelectionSounds,
  ActorsStoneSfxOutOfResourcesSounds,
  ActorsStoneSfxSelectionSounds,
  ActorsTreeSfxResourceDepletedSounds,
  ActorsTreeSfxSelectionSounds
} from "../sfx/ActorsResourcesSfx";
import { TivaraOlivalSfxSelectionSounds } from "../sfx/TivaraOlivalSfx";
import { SelectableDefinition } from "../entity/actor/components/selectable-component";
import { ActorAnimationsDefinition } from "../entity/actor/components/animation-actor-component";
import { ANIM_TIVARA_MACEMAN_MALE_DEFINITION } from "../animations/tivara_maceman_male_anims";
import { ANIM_TIVARA_SLINGSHOT_FEMALE_DEFINITION } from "../animations/tivara_slingshot_female_anims";
import { ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION } from "../animations/skaduwee_ranged_female_anim";
import { ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION } from "../animations/skaduwee_magician_female_anim";
import { ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION } from "../animations/skaduwee_warrior_male_anims";
import { ANIM_SKADUWEE_WORKER_FEMALE_DEFINITION } from "../animations/skaduwee_worker_female_anims";
import { ANIM_GENERAL_WARRIOR_DEFINITION } from "../animations/warrior_anim";
import { ANIM_TIVARA_WORKER_MALE_DEFINITION } from "../animations/tivara_worker_male_anims";
import { ANIM_SKADUWEE_WORKER_MALE_DEFINITION } from "../animations/skaduwee_worker_male_anims";
import { ANIM_TIVARA_WORKER_FEMALE_DEFINITION } from "../animations/tivara_worker_female_anims";
import { weaponDefinitions } from "../entity/combat/attack-data";
import { ANIM_HEDGEHOG_DEFINITION, ANIM_SHEEP_DEFINITION } from "../animations/animals";
import { ANIM_SKADUWEE_OWL_DEFINITION } from "../prefabs/units/skaduwee/SkaduweeOwlAnims";
import {
  ANIM_BADGER_DEFINITION,
  ANIM_BOAR_DEFINITION,
  ANIM_STAG_DEFINITION,
  ANIM_WOLF_DEFINITION
} from "../animations/animals2";
import { RepresentableDefinition } from "../entity/actor/components/representable-component";

const coreConstructionSiteDefinition: ConstructionSiteDefinition = {
  consumesBuilders: false,
  maxAssignedBuilders: 4,
  maxAssignedRepairers: 2,
  progressMadeAutomatically: 0,
  progressMadePerBuilder: 1,
  initialHealthPercentage: 0.2,
  repairFactor: 0.005,
  refundFactor: 0.5,
  startImmediately: false,
  canBeDragPlaced: false
};

const treeDefinitions: ActorInfoDefinition = {
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

const generalWorkerDefinitions: Partial<ActorInfoDefinition> = {
  components: {
    vision: {
      range: 5
    },
    health: {
      physicalState: ActorPhysicalType.Biological,
      maxHealth: 100
    },
    attack: {
      attacks: [weaponDefinitions.hands]
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
    healing: {
      range: 2,
      healPerCooldown: 5,
      cooldown: 1000
    },
    gatherer: {
      resourceSweepRadius: 20,
      resourceSourceGameObjectClasses: [
        ResourceType.Ambrosia,
        ResourceType.Wood,
        ResourceType.Minerals,
        ResourceType.Stone
      ]
    },
    selectable: {},
    translatable: {
      tileStepDuration: 500
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    }
  },
  systems: {
    movement: { enabled: true },
    action: { enabled: true }
  }
};

const tivaraWorkerDefinition: ActorInfoDefinition = {
  ...generalWorkerDefinitions,
  components: {
    ...generalWorkerDefinitions.components,
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
    requirements: {
      actors: [ObjectNames.Sandhold]
    },
    builder: {
      constructionSiteOffset: 2,
      enterConstructionSite: false,
      constructableBuildings: [
        ObjectNames.Sandhold,
        ObjectNames.AnkGuard,
        ObjectNames.Olival,
        ObjectNames.Temple,
        ObjectNames.WorkMill,
        ObjectNames.WatchTower,
        ObjectNames.Wall,
        ObjectNames.Stairs
      ]
    }
  }
};

const skaduweeWorkerDefinition: ActorInfoDefinition = {
  ...generalWorkerDefinitions,
  components: {
    ...generalWorkerDefinitions.components,
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
          originalColor: 0x7995bf,
          epsilon: 0.15
        }
      ]
    },
    requirements: {
      actors: [ObjectNames.FrostForge]
    },
    builder: {
      constructionSiteOffset: 2,
      enterConstructionSite: false,
      constructableBuildings: [
        ObjectNames.FrostForge,
        ObjectNames.InfantryInn,
        ObjectNames.Owlery,
        ObjectNames.WorkMill,
        ObjectNames.WatchTower,
        ObjectNames.Wall,
        ObjectNames.Stairs
      ]
    }
  }
};
export type ActorInfoDefinition = Partial<{
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
    gatherer: GathererDefinition;
    container: ContainerDefinition;
    resourceDrain: ResourceDrainDefinition;
    resourceSource: ResourceSourceDefinition;
    production: ProductionDefinition;
    healing: HealingDefinition;
    translatable: ActorTranslateDefinition;
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
}>;
export const pwActorDefinitions: {
  [key in ObjectNames]: ActorInfoDefinition;
} = {
  [ObjectNames.Hedgehog]: {
    components: {
      representable: {
        width: 32,
        height: 32
      },
      objectDescriptor: {
        color: 0x896347
      },
      translatable: {
        tileStepDuration: 5000
      },
      audio: {
        sounds: {
          [SoundType.Select]: ActorsHedgehogSfxSelectionSounds,
          [SoundType.SelectExtra]: ActorsHedgehogSfxAngrySounds
        }
      },
      animatable: { animations: ANIM_HEDGEHOG_DEFINITION }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  [ObjectNames.Sheep]: {
    components: {
      representable: {
        width: 64,
        height: 64
      },
      objectDescriptor: {
        color: 0xf2f7fa
      },
      translatable: {
        tileStepDuration: 5000
      },
      audio: {
        sounds: {
          [SoundType.Select]: ActorsSheepSfxBleatSounds,
          ["scissors"]: ActorsSheepSfxScissorsSounds,
          ["wool"]: ActorsSheepSfxWoolBombSounds
        }
      },
      animatable: { animations: ANIM_SHEEP_DEFINITION }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  Badger: {
    components: {
      representable: {
        width: 42,
        height: 32
      },
      objectDescriptor: {
        color: 0x222e37
      },
      translatable: {
        tileStepDuration: 800
      },
      audio: {
        sounds: {
          // todo
        }
      },
      animatable: { animations: ANIM_BADGER_DEFINITION }
    },
    systems: {
      movement: { enabled: true }
    }
  },
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
        tileStepDuration: 400
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
        tileStepDuration: 800
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
        range: 5
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
        tileStepDuration: 300
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

  [ObjectNames.GeneralWarrior]: {
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
        range: 5
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
        tileStepDuration: 500
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
  [ObjectNames.TivaraMacemanMale]: {
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
        range: 5
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
        tileStepDuration: 500
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
  [ObjectNames.TivaraSlingshotFemale]: {
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
        range: 5
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
        tileStepDuration: 500
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
  },
  [ObjectNames.TivaraWorkerFemale]: {
    ...tivaraWorkerDefinition,
    components: {
      ...tivaraWorkerDefinition.components,
      info: {
        name: "Tivara Scavenger",
        description: "Guardian of forgotten secrets, laboring in shadow to uphold the ancient cycle",
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
  [ObjectNames.TivaraWorkerMale]: {
    ...tivaraWorkerDefinition,
    components: {
      ...tivaraWorkerDefinition.components,
      info: {
        name: "Tivara Laborer",
        description: "Bound to the desert’s will, he rebuilds and gathers with relentless devotion",
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
  [ObjectNames.AnkGuard]: {
    components: {
      representable: {
        width: 256,
        height: 256
      },
      objectDescriptor: {
        color: 0xc2a080
      },
      owner: {
        color: [
          {
            originalColor: 0x800080,
            epsilon: 0
          }
        ]
      },
      vision: {
        range: 10
      },
      info: {
        name: "Ank Guard",
        description: "Oozing with ancient curse, this fortress births the mightiest of Tivara’s infantry",
        portraitAnimation: {
          idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_IDLE,
          action: ANIM_BUILDING_ICON_ANIMS_TIVARA_ANKGUARD_ACTION
        },
        smallImage: {
          key: "factions",
          frame: "building_icons/tivara/ankguard.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
      production: {
        queueCount: 1,
        capacityPerQueue: 5,
        availableProduceActors: [ObjectNames.TivaraSlingshotFemale, ObjectNames.TivaraMacemanMale]
      },
      selectable: {},
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.Olival]: {
    components: {
      representable: {
        width: 32,
        height: 64
      },
      objectDescriptor: {
        color: 0xc2a080
      },
      owner: {
        color: [
          {
            originalColor: 0x265b17,
            epsilon: 0.1
          }
        ]
      },
      vision: {
        range: 10
      },
      info: {
        name: "Olival",
        description: "A living gem that transforms the barren sands into a foundation for dark power",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/olival/olival.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
        actors: [ObjectNames.Sandhold]
      },
      selectable: {},
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      },
      audio: {
        sounds: {
          [SoundType.Select]: TivaraOlivalSfxSelectionSounds
        }
      }
    }
  },
  [ObjectNames.Sandhold]: {
    components: {
      representable: {
        width: 320,
        height: 320
      },
      objectDescriptor: {
        color: 0xc2a080
      },
      owner: {
        color: [
          {
            originalColor: 0x4dbd33,
            epsilon: 0.1
          }
        ]
      },
      vision: {
        range: 15
      },
      info: {
        name: "Sandhold",
        description:
          "A monument of stone and shadow, Sandhold is the cradle of Tivara’s power, commanding the restless workers and hoarding the lifeblood of the desert",
        portraitAnimation: {
          idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE,
          action: ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION
        },
        smallImage: {
          key: "factions",
          frame: "building_icons/tivara/sandhold.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100,
        maxArmour: 50
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
      container: {
        capacity: 2
      },
      resourceDrain: {
        resourceTypes: [ResourceType.Wood, ResourceType.Minerals, ResourceType.Stone, ResourceType.Ambrosia]
      },
      production: {
        queueCount: 1,
        capacityPerQueue: 5,
        availableProduceActors: [ObjectNames.TivaraWorkerMale, ObjectNames.TivaraWorkerFemale]
      },
      selectable: {},
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.Temple]: {
    components: {
      representable: {
        width: 192,
        height: 192
      },
      objectDescriptor: {
        color: 0xc2a080
      },
      owner: {
        color: [
          {
            originalColor: 0x5c9999,
            epsilon: 0
          }
        ]
      },
      vision: {
        range: 10
      },
      info: {
        name: "Temple",
        description:
          "Draped in fine fabrics and surrounded by sacred artifacts, this temple hums with the power of forgotten rituals.",
        portraitAnimation: {
          idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_IDLE,
          action: ANIM_BUILDING_ICON_ANIMS_TIVARA_TEMPLE_ACTION
        },
        smallImage: {
          key: "factions",
          frame: "building_icons/tivara/temple.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
      production: {
        queueCount: 1,
        capacityPerQueue: 5,
        availableProduceActors: [ObjectNames.TivaraSlingshotFemale]
      },
      selectable: {},
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.WorkMill]: {
    components: {
      representable: {
        width: 128,
        height: 128
      },
      objectDescriptor: {
        color: 0x967847
      },
      owner: {
        color: [
          {
            originalColor: 0x825e39,
            epsilon: 0
          }
        ]
      },
      vision: {
        range: 8
      },
      info: {
        name: "Work Mill",
        description: "A sturdy mill that turns raw timber into vital resources",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/workmill.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
      resourceDrain: {
        resourceTypes: [ResourceType.Wood]
      },
      selectable: {},
      collider: { enabled: true },
      container: {
        capacity: 2
      },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.SkaduweeOwl]: {
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
        range: 10
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
        usePathfinding: false,
        tileStepDuration: 1000,
        isFlying: true
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
  [ObjectNames.SkaduweeRangedFemale]: {
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
        range: 5
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
        tileStepDuration: 500
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
  [ObjectNames.SkaduweeMagicianFemale]: {
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
        range: 5
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
        tileStepDuration: 500
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
  [ObjectNames.SkaduweeWarriorMale]: {
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
        range: 5
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
        tileStepDuration: 500
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
  [ObjectNames.SkaduweeWorkerMale]: {
    ...skaduweeWorkerDefinition,
    components: {
      ...skaduweeWorkerDefinition.components,
      info: {
        name: "Darkwright",
        description: "A shadowbound worker, crafting the foundation of dark dominion",
        smallImage: {
          key: "factions",
          frame: "character_icons/skaduwee/worker_male.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      audio: {
        sounds: {
          [SoundType.Attack]: SkaduweeWorkerMaleSfxAttackSounds,
          [SoundType.Damage]: SkaduweeWorkerMaleSfxDamageSounds,
          [SoundType.Death]: SkaduweeWorkerMaleSfxDeathSounds,
          [SoundType.Select]: SkaduweeWorkerMaleSfxSelectionSounds,
          [SoundType.Move]: SkaduweeWorkerMaleSfxMoveSounds,
          [SoundType.EnterContainer]: SkaduweeWorkerMaleSfxEnterSounds,
          [SoundType.LocationUnavailable]: SkaduweeWorkerMaleSfxLocationSounds,
          [SoundType.Repair]: SkaduweeWorkerMaleSfxRepairSounds,
          [SoundType.Heal]: SkaduweeWorkerMaleSfxRepairSounds,
          [SoundType.Build]: SkaduweeWorkerMaleSfxBuildSounds,
          [SoundType.Chop]: SkaduweeWorkerMaleSfxChopSounds,
          [SoundType.Mine]: SkaduweeWorkerMaleSfxMineSounds
        }
      },
      animatable: { animations: ANIM_SKADUWEE_WORKER_MALE_DEFINITION }
    }
  },
  [ObjectNames.SkaduweeWorkerFemale]: {
    ...skaduweeWorkerDefinition,
    components: {
      ...skaduweeWorkerDefinition.components,
      info: {
        name: "Shadehand",
        description: "With whispered effort, the foundations of shadow are laid",
        smallImage: {
          key: "factions",
          frame: "character_icons/skaduwee/worker_female.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      audio: {
        sounds: {
          [SoundType.Attack]: SkaduweeWorkerFemaleSfxAttackSounds,
          [SoundType.Damage]: SkaduweeWorkerFemaleSfxDamageSounds,
          [SoundType.Death]: SkaduweeWorkerFemaleSfxDeathSounds,
          [SoundType.Select]: SkaduweeWorkerFemaleSfxSelectSounds,
          [SoundType.Move]: SkaduweeWorkerFemaleSfxMoveSounds,
          [SoundType.EnterContainer]: SkaduweeWorkerFemaleSfxEnterSounds,
          [SoundType.LocationUnavailable]: SkaduweeWorkerFemaleSfxLocationSounds,
          [SoundType.Repair]: SkaduweeWorkerFemaleSfxRepairSounds,
          [SoundType.Heal]: SkaduweeWorkerFemaleSfxRepairSounds,
          [SoundType.Build]: SkaduweeWorkerFemaleSfxBuildSounds,
          [SoundType.Chop]: SkaduweeWorkerFemaleSfxChopSounds,
          [SoundType.Mine]: SkaduweeWorkerFemaleSfxMineSounds
        }
      },
      animatable: { animations: ANIM_SKADUWEE_WORKER_FEMALE_DEFINITION }
    }
  },
  [ObjectNames.FrostForge]: {
    components: {
      representable: {
        width: 256,
        height: 384
      },
      objectDescriptor: {
        color: 0xf2f7fa
      },
      owner: {
        color: [
          {
            originalColor: 0x7d9cdb,
            epsilon: 0
          }
        ]
      },
      vision: {
        range: 15
      },
      info: {
        name: "Frost Forge",
        description: "Main building of the Skaduwee faction. It is used to produce workers and store resources.",
        portraitAnimation: {
          idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_FROST_FORGE,
          action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_FROST_FORGE
        },
        smallImage: {
          key: "factions",
          frame: "building_icons/skaduwee/frost_forge.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
      container: {
        capacity: 2
      },
      resourceDrain: {
        resourceTypes: [ResourceType.Wood, ResourceType.Minerals, ResourceType.Stone, ResourceType.Ambrosia]
      },
      production: {
        queueCount: 1,
        capacityPerQueue: 5,
        availableProduceActors: [ObjectNames.SkaduweeWorkerMale, ObjectNames.SkaduweeWorkerFemale]
      },
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.InfantryInn]: {
    components: {
      representable: {
        width: 128,
        height: 128
      },
      objectDescriptor: {
        color: 0xf2f7fa
      },
      owner: {
        color: [
          {
            originalColor: 0x7d9cdb,
            epsilon: 0
          }
        ]
      },
      vision: {
        range: 10
      },
      info: {
        name: "Infantry Inn",
        description: "Trains infantry units",
        portraitAnimation: {
          idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN,
          action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN
        },
        smallImage: {
          key: "factions",
          frame: "building_icons/skaduwee/infantry_inn.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
      production: {
        queueCount: 1,
        capacityPerQueue: 5,
        availableProduceActors: [
          ObjectNames.SkaduweeMagicianFemale,
          ObjectNames.SkaduweeRangedFemale,
          ObjectNames.SkaduweeWarriorMale
        ]
      },
      selectable: {},
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.Owlery]: {
    components: {
      representable: {
        width: 64,
        height: 192
      },
      objectDescriptor: {
        color: 0xf2f7fa
      },
      owner: {
        color: [
          {
            originalColor: 0xf4f5f7,
            epsilon: 0
          }
        ]
      },
      vision: {
        range: 12
      },
      info: {
        name: "Owlery",
        description: "Produces Owls",
        portraitAnimation: {
          idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE,
          action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION
        },
        smallImage: {
          key: "factions",
          frame: "building_icons/skaduwee/owlery.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 100
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
      production: {
        queueCount: 1,
        capacityPerQueue: 5,
        availableProduceActors: [ObjectNames.SkaduweeOwl]
      },
      selectable: {},
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.Tree1]: {
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
  [ObjectNames.Tree4]: {
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
  [ObjectNames.Tree5]: {
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
  [ObjectNames.Tree6]: {
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
  [ObjectNames.Tree7]: {
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
  [ObjectNames.Tree9]: {
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
  [ObjectNames.Tree10]: {
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
  [ObjectNames.Tree11]: {
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
  [ObjectNames.Stairs]: {
    components: {
      representable: {
        width: 64,
        height: 64
      },
      objectDescriptor: {
        color: 0x95a083
      },
      info: {
        name: "Stairs",
        description: "Used to move to top of the Wall and Watch Tower",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/stairs/stairs_top_left.png",
          origin: { x: 0.5, y: 0.5 }
        }
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
      selectable: {},
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 300,
        healthDisplayBehavior: "onDamage"
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
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.WatchTower]: {
    components: {
      representable: {
        width: 128,
        height: 176
      },
      objectDescriptor: {
        color: 0x95a083
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
        range: 15
      },
      info: {
        name: "Watch Tower",
        description: "Main defense building",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/watchtower.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      selectable: {},
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 1000,
        healthDisplayBehavior: "onDamage"
      },
      productionCost: {
        resources: {
          [ResourceType.Wood]: 10,
          [ResourceType.Stone]: 30
        },
        refundFactor: 0.5,
        productionTime: 5000,
        costType: PaymentType.PayImmediately
      },
      container: {
        capacity: 2
      },
      attack: {
        attacks: [weaponDefinitions.bowTower]
      },
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.Wall]: {
    components: {
      representable: {
        width: 64,
        height: 96
      },
      objectDescriptor: {
        color: 0x95a083
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
        name: "Wall",
        description: "Defense building",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/wall/wall_top_right_bottom_left.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      selectable: {},
      health: {
        physicalState: ActorPhysicalType.Structural,
        maxHealth: 300,
        healthDisplayBehavior: "onDamage"
      },
      productionCost: {
        resources: {
          [ResourceType.Wood]: 10,
          [ResourceType.Stone]: 30
        },
        refundFactor: 0.5,
        productionTime: 5000,
        costType: PaymentType.PayImmediately
      },
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition,
        canBeDragPlaced: true
      }
    }
  },
  [ObjectNames.Minerals]: {
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
  [ObjectNames.StonePile]: {
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
