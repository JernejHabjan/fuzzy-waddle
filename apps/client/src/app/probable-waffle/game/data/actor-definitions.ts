import { ObjectNames } from "./object-names";
import { ObjectDescriptorDefinition } from "../entity/actor/components/object-descriptor-component";
import { OwnerDefinition } from "../entity/actor/components/owner-component";
import { VisionDefinition } from "../entity/actor/components/vision-component";
import { InfoDefinition } from "../entity/actor/components/info-component";
import { RequirementsDefinition } from "../entity/actor/components/requirements-component";
import { BuilderDefinition } from "../entity/actor/components/builder-component";
import { GathererDefinition } from "../entity/actor/components/gatherer-component";
import { DamageType } from "../entity/combat/damage-type";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../entity/building/payment-type";
import { AttackDefinition } from "../entity/combat/components/attack-component";
import { HealthDefinition } from "../entity/combat/components/health-component";
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
import { ActorAnimationsDefinition, AnimationType } from "../entity/actor/components/animation-actor-component";
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
      maxHealth: 100
    },
    attack: {
      attacks: [
        {
          damage: 1,
          damageType: DamageType.Physical,
          cooldown: 1000,
          range: 1,
          animationType: AnimationType.Thrust
        },
        {
          damage: 1,
          damageType: DamageType.Physical,
          cooldown: 1000,
          range: 1,
          animationType: AnimationType.Slash
        }
      ]
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
      animatable: {
        animations: {
          // todo
        }
      }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  [ObjectNames.Sheep]: {
    components: {
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
      animatable: {
        animations: {
          // todo
        }
      }
    },
    systems: {
      movement: { enabled: true }
    }
  },
  [ObjectNames.GeneralWarrior]: {
    components: {
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
        name: "Warrior",
        description: "A warrior",
        smallImage: {
          key: "factions",
          frame: "character_icons/general/warrior.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        maxHealth: 100
      },
      attack: {
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.Thrust
          }
        ]
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
        name: "Tivara Maceman",
        description: "A maceman",
        smallImage: {
          key: "factions",
          frame: "character_icons/tivara/maceman_male.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        maxHealth: 100
      },
      attack: {
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.Slash
          },
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.InvertedSlash
          },
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.LargeSlash
          }
        ]
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
        name: "Tivara Slingshot",
        description: "A slingshot unit",
        smallImage: {
          key: "factions",
          frame: "character_icons/tivara/slingshot_female.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        maxHealth: 100
      },
      attack: {
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 3,
            animationType: AnimationType.Shoot
          }
        ]
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
        name: "Tivara Female Worker",
        description: "A worker",
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
        name: "Tivara Male Worker",
        description: "A worker",
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
        range: 5
      },
      info: {
        name: "Ank Guard",
        description: "Produces Slingshot and Maceman",
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
        range: 5
      },
      info: {
        name: "Olival",
        description: "Creates a suitable surface for Tivara units and buildings",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/olival/olival.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
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
        range: 5
      },
      info: {
        name: "Sandhold",
        description: "Main building of the Tivara faction. It is used to produce workers and store resources.",
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
        range: 5
      },
      info: {
        name: "Temple",
        description: "Produces Tivara Sling shooters",
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
        range: 5
      },
      info: {
        name: "Work Mill",
        description: "Useful for producing wood",
        smallImage: {
          key: "factions",
          frame: "buildings/tivara/workmill.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
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
        range: 5
      },
      info: {
        name: "Skaduwee Owl",
        description: "A flying unit",
        smallImage: {
          key: "factions",
          frame: "character_icons/skaduwee/owl.png",
          origin: { x: 0.5, y: 0.5 }
        }
      },
      health: {
        maxHealth: 100
      },
      attack: {
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 3,
            animationType: AnimationType.Shoot
          }
        ]
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
        tileStepDuration: 1000
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
      animatable: {
        animations: {
          // todo
        }
      }
    },
    systems: {
      movement: { enabled: true },
      action: { enabled: true }
    }
  },
  [ObjectNames.SkaduweeRangedFemale]: {
    components: {
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
        name: "Skaduwee Ranged",
        description: "A ranged unit",
        smallImage: {
          key: "factions",
          frame: "character_icons/skaduwee/ranged_female.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        maxHealth: 100
      },
      attack: {
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 3,
            animationType: AnimationType.Shoot
          }
        ]
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
        name: "Skaduwee Magician",
        description: "A magician",
        smallImage: {
          key: "factions",
          frame: "character_icons/skaduwee/magician_female.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        maxHealth: 50
      },
      attack: {
        attacks: [
          {
            damage: 20,
            damageType: DamageType.Magical,
            cooldown: 3000,
            range: 10,
            animationType: AnimationType.Cast
          },
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 3000,
            range: 2,
            animationType: AnimationType.LargeThrust
          }
        ]
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
        name: "Skaduwee Warrior",
        description: "A warrior",
        smallImage: {
          key: "factions",
          frame: "character_icons/skaduwee/warrior_male.png",
          origin: { x: 0.5, y: 0.6 }
        }
      },
      health: {
        maxHealth: 100
      },
      attack: {
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.Slash
          },
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.InvertedSlash
          },
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 1,
            animationType: AnimationType.Smash
          }
        ]
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
        name: "Skaduwee Male Worker",
        description: "A worker",
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
        name: "Skaduwee Female Worker",
        description: "A worker",
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
        range: 5
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
        range: 5
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
        range: 5
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
      }
    }
  },
  [ObjectNames.Stairs]: {
    components: {
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
        range: 5
      },
      selectable: {},
      health: {
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
        range: 8
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
        attacks: [
          {
            damage: 10,
            damageType: DamageType.Physical,
            cooldown: 1000,
            range: 10,
            animationType: AnimationType.Shoot
          }
        ]
      },
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
      }
    }
  },
  [ObjectNames.Wall]: {
    components: {
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
        range: 8
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
  [ObjectNames.Stone]: {
    components: {
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
