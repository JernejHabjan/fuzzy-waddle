import { WeaponType } from "./weapon-type";
import { ProjectileType } from "./projectile-type";
import { EffectsAnims } from "../../../animations/effects";
import { DamageType } from "./damage-type";
import { AnimationType } from "../animation/animation-type";
import {
  SharedActorActionsSfxArrowHitSounds,
  SharedActorActionsSfxArrowShootMultipleSounds,
  SharedActorActionsSfxArrowShootSounds,
  SharedActorActionsSfxAxeHitSounds,
  SharedActorActionsSfxFireballFireSounds,
  SharedActorActionsSfxFireballHitSounds,
  SharedActorActionsSfxFireSpellSounds,
  SharedActorActionsSfxFrostFireSounds,
  SharedActorActionsSfxFrostImpactSounds,
  SharedActorActionsSfxHeavyWeaponSwingSounds,
  SharedActorActionsSfxLeatherNockSounds,
  SharedActorActionsSfxMaceHitSounds,
  SharedActorActionsSfxPunchHitSounds,
  SharedActorActionsSfxSlingshotFireSounds,
  SharedActorActionsSfxSlingshotHitSounds,
  SharedActorActionsSfxSpearStabHitSounds,
  SharedActorActionsSfxStaffHitSounds
} from "../../../sfx/shared-actor-actions-sfx";
import {
  SkaduweeOwlSfxFurballFireSounds,
  SkaduweeOwlSfxFurballHitSounds
} from "../../../prefabs/characters/skaduwee/skaduwee-owl/SkaduweeOwlSfx";
import type { AttackData } from "./attack-data";

export const weaponDefinitions: Record<WeaponType, AttackData> = {
  [WeaponType.TivaraSlingshot]: {
    weaponType: WeaponType.TivaraSlingshot,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.SlingshotProjectile,
      speed: 700,
      orientation: {
        randomizeOrientation: true,
        pointingOrientation: 0,
        rotationSpeed: 400
      },
      impactAnimation: {
        anims: EffectsAnims.debrisAnimations
      }
    },
    damage: 5,
    damageType: DamageType.Physical,
    cooldown: 1400,
    range: 5,
    minRange: 2,
    highGroundRangeBonus: 1,
    animationType: AnimationType.Shoot,
    sounds: {
      preparing: SharedActorActionsSfxLeatherNockSounds,
      fire: SharedActorActionsSfxSlingshotFireSounds,
      hit: SharedActorActionsSfxSlingshotHitSounds
    },
    delays: {
      fire: 1000,
      hit: 0
    }
  },
  [WeaponType.OrcBoomerang]: {
    weaponType: WeaponType.TivaraSlingshot,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.SlingshotProjectile, // todo
      speed: 700,
      orientation: {
        randomizeOrientation: true,
        pointingOrientation: 0,
        rotationSpeed: 400
      },
      impactAnimation: {
        anims: EffectsAnims.debrisAnimations
      }
    },
    damage: 5,
    damageType: DamageType.Physical,
    cooldown: 1400,
    range: 5,
    minRange: 2,
    highGroundRangeBonus: 1,
    animationType: AnimationType.Shoot,
    sounds: {
      preparing: SharedActorActionsSfxLeatherNockSounds, // todo
      fire: SharedActorActionsSfxSlingshotFireSounds, // todo
      hit: SharedActorActionsSfxSlingshotHitSounds // todo
    },
    delays: {
      fire: 1000,
      hit: 0
    }
  },
  [WeaponType.SkaduweeBow]: {
    weaponType: WeaponType.SkaduweeBow,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.ArrowProjectile,
      speed: 1000,
      orientation: {
        randomizeOrientation: false,
        pointingOrientation: 0
      }
    },
    damage: 4,
    damageType: DamageType.Physical,
    cooldown: 1400,
    range: 7,
    minRange: 3,
    highGroundRangeBonus: 2,
    animationType: AnimationType.Shoot,
    sounds: {
      preparing: SharedActorActionsSfxLeatherNockSounds,
      fire: SharedActorActionsSfxArrowShootSounds,
      hit: SharedActorActionsSfxArrowHitSounds
    },
    delays: {
      fire: 1000,
      hit: 0
    }
  },
  [WeaponType.SkeletonBow]: {
    weaponType: WeaponType.SkeletonBow,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.ArrowProjectile,
      speed: 1000,
      orientation: {
        randomizeOrientation: false,
        pointingOrientation: 0
      }
    },
    damage: 4,
    damageType: DamageType.Physical,
    cooldown: 1200,
    range: 6,
    minRange: 3,
    highGroundRangeBonus: 2,
    animationType: AnimationType.Shoot,
    sounds: {
      preparing: SharedActorActionsSfxLeatherNockSounds,
      fire: SharedActorActionsSfxArrowShootSounds,
      hit: SharedActorActionsSfxArrowHitSounds
    },
    delays: {
      fire: 1000,
      hit: 0
    }
  },
  [WeaponType.FrostSpell]: {
    weaponType: WeaponType.FrostSpell,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.FrostBoltProjectile,
      speed: 800,
      orientation: {
        randomizeOrientation: false,
        pointingOrientation: 0
      },
      impactAnimation: {
        anims: EffectsAnims.fireImpacts,
        tint: 0x5494da
      }
    },
    damage: 7,
    damageType: DamageType.Frost,
    cooldown: 2000,
    range: 6,
    minRange: 3,
    highGroundRangeBonus: 2,
    animationType: AnimationType.Cast,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxFrostFireSounds,
      hit: SharedActorActionsSfxFrostImpactSounds
    },
    delays: {
      fire: 500,
      hit: 0
    }
  },
  [WeaponType.FireSpell]: {
    weaponType: WeaponType.FireSpell,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.FireballProjectile,
      speed: 800,
      orientation: {
        randomizeOrientation: false,
        pointingOrientation: 0
      },
      impactAnimation: {
        anims: EffectsAnims.fireImpacts
      }
    },
    damage: 7,
    damageType: DamageType.Fire,
    cooldown: 2000,
    range: 6,
    minRange: 3,
    highGroundRangeBonus: 2,
    animationType: AnimationType.Cast,
    sounds: {
      preparing: SharedActorActionsSfxFireSpellSounds,
      fire: SharedActorActionsSfxFireballFireSounds,
      hit: SharedActorActionsSfxFireballHitSounds
    },
    delays: {
      fire: 500,
      hit: 0
    }
  },
  [WeaponType.Tivara]: {
    weaponType: WeaponType.Tivara,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.LargeSlash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxMaceHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.SkaduweeAxe]: {
    weaponType: WeaponType.SkaduweeAxe,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Smash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxAxeHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.SkeletonScythe]: {
    weaponType: WeaponType.SkeletonScythe,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Smash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxAxeHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.SkeletonSword]: {
    weaponType: WeaponType.SkeletonSword,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxAxeHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.OrcSword]: {
    weaponType: WeaponType.OrcSword,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxAxeHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.PirateScimitar]: {
    weaponType: WeaponType.PirateScimitar,
    canTargetAir: false,
    damage: 3,
    damageType: DamageType.Physical,
    cooldown: 700,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxAxeHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.CyclopsHalberd]: {
    weaponType: WeaponType.CyclopsHalberd,
    canTargetAir: false,
    damage: 7,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.LargeSlash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds,
      hit: SharedActorActionsSfxAxeHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.GeneralWarriorSpear]: {
    weaponType: WeaponType.GeneralWarriorSpear,
    canTargetAir: false,
    damage: 5,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.LargeThrust,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxSpearStabHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.CenturionSpear]: {
    weaponType: WeaponType.CenturionSpear,
    canTargetAir: false,
    damage: 9,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.LargeThrust,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxSpearStabHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.SkaduweeMagicianStaff]: {
    weaponType: WeaponType.SkaduweeMagicianStaff,
    canTargetAir: false,
    damage: 3,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Thrust,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxStaffHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.WorkerHands]: {
    weaponType: WeaponType.WorkerHands,
    canTargetAir: false,
    damage: 1,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Thrust,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxPunchHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.MummyHands]: {
    weaponType: WeaponType.MummyHands,
    canTargetAir: false,
    damage: 4,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxPunchHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.SkeletonHands]: {
    weaponType: WeaponType.SkeletonHands,
    canTargetAir: false,
    damage: 4,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxPunchHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.ZombieHands]: {
    weaponType: WeaponType.ZombieHands,
    canTargetAir: false,
    damage: 4,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxPunchHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.ZombieLargeHands]: {
    weaponType: WeaponType.ZombieLargeHands,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1500,
    range: 2,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Slash,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxPunchHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.MinotaurHands]: {
    weaponType: WeaponType.MinotaurHands,
    canTargetAir: false,
    damage: 10,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.Thrust,
    sounds: {
      preparing: null,
      fire: null,
      hit: SharedActorActionsSfxPunchHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.Furball]: {
    weaponType: WeaponType.Furball,
    canTargetAir: true,
    projectile: {
      type: ProjectileType.FurballProjectile,
      speed: 800,
      orientation: {
        randomizeOrientation: true,
        pointingOrientation: 0
      },
      impactAnimation: {
        anims: [EffectsAnims.ANIM_IMPACT_1],
        tint: 0x006600
      }
    },
    damage: 9,
    damageType: DamageType.Poison,
    cooldown: 3000,
    range: 6,
    minRange: 0,
    highGroundRangeBonus: 1,
    animationType: AnimationType.Shoot,
    sounds: {
      preparing: null,
      fire: SkaduweeOwlSfxFurballFireSounds,
      hit: SkaduweeOwlSfxFurballHitSounds
    },
    delays: {
      fire: 200,
      hit: 500
    }
  },
  [WeaponType.BowTower]: {
    weaponType: WeaponType.BowTower,
    canTargetAir: true,
    damage: 20,
    damageType: DamageType.Physical,
    cooldown: 1400,
    range: 7,
    minRange: 0,
    highGroundRangeBonus: 2,
    animationType: AnimationType.Shoot,
    sounds: {
      preparing: SharedActorActionsSfxLeatherNockSounds,
      fire: SharedActorActionsSfxArrowShootMultipleSounds,
      hit: SharedActorActionsSfxArrowHitSounds
    },
    delays: {
      fire: 1000,
      hit: 500
    }
  },
  [WeaponType.WolfBite]: {
    weaponType: WeaponType.WolfBite,
    canTargetAir: false,
    damage: 5,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
    highGroundRangeBonus: 0,
    animationType: AnimationType.LargeSlash,
    sounds: {
      preparing: null,
      fire: SharedActorActionsSfxHeavyWeaponSwingSounds, // todo
      hit: SharedActorActionsSfxMaceHitSounds // todo
    },
    delays: {
      fire: 200,
      hit: 500
    }
  }
};
