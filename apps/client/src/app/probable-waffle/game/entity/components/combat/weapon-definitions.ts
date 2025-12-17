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
  [WeaponType.Slingshot]: {
    weaponType: WeaponType.Slingshot,
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
  [WeaponType.Bow]: {
    weaponType: WeaponType.Bow,
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
  [WeaponType.Mace]: {
    weaponType: WeaponType.Mace,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
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
  [WeaponType.Axe]: {
    weaponType: WeaponType.Axe,
    canTargetAir: false,
    damage: 6,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
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
  [WeaponType.Spear]: {
    weaponType: WeaponType.Spear,
    canTargetAir: false,
    damage: 5,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
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
  [WeaponType.Staff]: {
    weaponType: WeaponType.Staff,
    canTargetAir: false,
    damage: 3,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 2,
    minRange: 0,
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
  [WeaponType.Hands]: {
    weaponType: WeaponType.Hands,
    canTargetAir: false,
    damage: 1,
    damageType: DamageType.Physical,
    cooldown: 1000,
    range: 1,
    minRange: 0,
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
