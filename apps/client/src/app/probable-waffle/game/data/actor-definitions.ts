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

const coreConstructionSiteDefinition: ConstructionSiteDefinition = {
  consumesBuilders: false,
  maxAssignedBuilders: 4,
  progressMadeAutomatically: 1,
  progressMadePerBuilder: 1,
  initialHealthPercentage: 0.2,
  refundFactor: 0.5,
  startImmediately: true
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
    selectable: { enabled: true },
    resourceSource: {
      resourceType: ResourceType.Wood,
      maximumResources: 20,
      gatheringFactor: 1
    }
  }
};
const stairsDefinition: ActorInfoDefinition = {
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
      range: 5
    },
    selectable: { enabled: true },
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
    collider: { enabled: true },
    constructable: {
      ...coreConstructionSiteDefinition
    }
  }
};

const wallDefinition: ActorInfoDefinition = {
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
      range: 5
    },
    selectable: { enabled: true },
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
    collider: { enabled: true }
  }
};

const tivaraWorkerDefinition: ActorInfoDefinition = {
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
    health: {
      maxHealth: 100
    },
    attack: {
      attacks: [
        {
          damage: 1,
          damageType: DamageType.Physical,
          cooldown: 1000,
          range: 1
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
      actors: [ObjectNames.Sandhold]
    },
    builder: {
      constructableBuildings: [
        ObjectNames.Sandhold,
        ObjectNames.AnkGuard,
        ObjectNames.Olival,
        ObjectNames.Temple,
        ObjectNames.WorkMill
      ],
      constructionSiteOffset: 2,
      enterConstructionSite: false
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
    selectable: { enabled: true },
    translatable: {
      tileStepDuration: 500
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    }
  },
  systems: {
    movement: { enabled: true }
  }
};

const skaduweeWorkerDefinition: ActorInfoDefinition = {
  components: {
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
          range: 1
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
      actors: [ObjectNames.FrostForge]
    },
    builder: {
      constructableBuildings: [
        ObjectNames.FrostForge,
        ObjectNames.InfantryInn,
        ObjectNames.Owlery,
        ObjectNames.WorkMill
      ],
      constructionSiteOffset: 2,
      enterConstructionSite: false
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
    selectable: { enabled: true },
    translatable: {
      tileStepDuration: 500
    },
    containable: { enabled: true },
    aiControlled: {
      type: AiType.Character
    }
  },
  systems: {
    movement: { enabled: true }
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
    translatable: ActorTranslateDefinition;
    aiControlled: PawnAiDefinition;
    containable: { enabled: boolean };
    selectable: { enabled: boolean };
    collider: ColliderDefinition;
  }>;
  systems: Partial<{
    movement: {
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
            range: 1
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
      selectable: { enabled: true },
      translatable: {
        tileStepDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      }
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
            range: 1
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
      selectable: { enabled: true },
      translatable: {
        tileStepDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      }
    },
    systems: {
      movement: { enabled: true }
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
            range: 3
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
      selectable: { enabled: true },
      translatable: {
        tileStepDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      }
    },
    systems: {
      movement: { enabled: true }
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
      }
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
      }
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
      selectable: { enabled: true },
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
      selectable: { enabled: true },
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
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
      selectable: { enabled: true },
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
      selectable: { enabled: true },
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
      selectable: { enabled: true },
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
            range: 3
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
        actors: [ObjectNames.Owlery]
      },
      translatable: {
        usePathfinding: false,
        tileStepDuration: 1000
      }
    },
    systems: { movement: { enabled: true } }
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
            range: 3
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
      selectable: { enabled: true },
      translatable: {
        tileStepDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      }
    },
    systems: {
      movement: { enabled: true }
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
            range: 10
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
      selectable: { enabled: true },
      translatable: {
        tileStepDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      }
    },
    systems: {
      movement: { enabled: true }
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
            range: 1
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
      selectable: { enabled: true },
      translatable: {
        tileStepDuration: 500
      },
      containable: { enabled: true },
      aiControlled: {
        type: AiType.Character
      }
    },
    systems: {
      movement: { enabled: true }
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
      }
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
      }
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
      selectable: { enabled: true },
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
      selectable: { enabled: true },
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
      selectable: { enabled: true },
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
  [ObjectNames.StairsLeft]: stairsDefinition,
  [ObjectNames.StairsRight]: stairsDefinition,
  [ObjectNames.WallBottomLeft]: wallDefinition,
  [ObjectNames.WallBottomLeftBottomRight]: wallDefinition,
  [ObjectNames.WallBottomRight]: wallDefinition,
  [ObjectNames.WallEmpty]: wallDefinition,
  [ObjectNames.WallTopLeft]: wallDefinition,
  [ObjectNames.WallTopLeftBottomLeft]: wallDefinition,
  [ObjectNames.WallTopLeftBottomRight]: wallDefinition,
  [ObjectNames.WallTopLeftTopRight]: wallDefinition,
  [ObjectNames.WallTopRight]: wallDefinition,
  [ObjectNames.WallTopRightBottomLeft]: wallDefinition,
  [ObjectNames.WallTopRightBottomRight]: wallDefinition,
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
      selectable: { enabled: true },
      health: {
        maxHealth: 100
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
      collider: { enabled: true },
      constructable: {
        ...coreConstructionSiteDefinition
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
      selectable: { enabled: true },
      resourceSource: {
        resourceType: ResourceType.Minerals,
        maximumResources: 100,
        gatheringFactor: 1
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
      selectable: { enabled: true },
      resourceSource: {
        resourceType: ResourceType.Stone,
        maximumResources: 100,
        gatheringFactor: 1
      }
    }
  }
};
