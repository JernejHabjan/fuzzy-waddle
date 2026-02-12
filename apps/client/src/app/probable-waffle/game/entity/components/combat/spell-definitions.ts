import { SpellType } from "./spell-type";
import type { SpellData } from "./spell-data";
import { ProjectileType } from "./projectile-type";
import { AnimationType } from "../animation/animation-type";
import { DamageType, ObjectNames, SpellTargetType } from "@fuzzy-waddle/api-interfaces";
import { ResearchType } from "../research/research-type";

export const spellDefinitions: Record<SpellType, SpellData> = {
  // ========== SNOWSTORM - AOE Freeze + DoT ==========
  [SpellType.Snowstorm]: {
    type: SpellType.Snowstorm,
    name: "Snowstorm",
    description: "Freezes enemies in an area, dealing frost damage over time",
    cooldown: 30000,
    range: 8,
    aoeRadius: 3,
    targetType: SpellTargetType.Ground,
    targetAllies: false,
    targetEnemies: true,
    targetSelf: false,
    damageType: DamageType.Frost,
    instantDamage: 5,
    dotDamage: 2,
    dotTickInterval: 1000,
    dotDuration: 5000,
    stunDuration: 5000,
    tintColor: 0x6666ff,
    projectile: {
      type: ProjectileType.SnowstormProjectile,
      speed: 400,
      orientation: { randomizeOrientation: false, pointingOrientation: 270 },
      impactAnimation: { anims: ["snowstorm_impact"], tint: 0x6666ff },
      spawnBehavior: {
        type: "fall",
        spawnOffsetY: -200, // Spawn 200 pixels above target
        ease: "Cubic.easeIn" // Accelerate as it falls
      }
    },
    castAnimation: AnimationType.Cast,
    sounds: { cast: "frost_cast", impact: "frost_impact" },
    icon: { key: "factions", frame: "spell_icons/snowstorm.png" },
    autocastDefault: true,
    requiresResearch: ResearchType.SnowstormSpell
  },

  // ========== FIRESTORM - Persistent AOE Burn Zone ==========
  [SpellType.Firestorm]: {
    type: SpellType.Firestorm,
    name: "Firestorm",
    description: "Creates a burning zone that damages enemies who enter or remain inside",
    cooldown: 45000,
    range: 10,
    aoeRadius: 4,
    targetType: SpellTargetType.Ground,
    targetAllies: false,
    targetEnemies: true,
    targetSelf: false,
    damageType: DamageType.Fire,
    tintColor: 0xff6600,
    persistentZone: {
      duration: 8000,
      tickInterval: 1000,
      visualEffect: "fire_zone_effect"
    },
    dotDamage: 5,
    dotTickInterval: 1000,
    dotDuration: 2000,
    castAnimation: AnimationType.Cast,
    sounds: { cast: "fire_cast", impact: "fire_ignite", loop: "fire_burning" },
    icon: { key: "factions", frame: "spell_icons/firestorm.png" },
    autocastDefault: false,
    requiresResearch: ResearchType.FirestormSpell
  },

  // ========== FROST NOVA - AOE Slow (no stun) ==========
  [SpellType.FrostNova]: {
    type: SpellType.FrostNova,
    name: "Frost Nova",
    description: "Slows all enemies in an area by 50% for 4 seconds",
    cooldown: 20000,
    range: 6,
    aoeRadius: 3,
    targetType: SpellTargetType.Ground,
    targetAllies: false,
    targetEnemies: true,
    targetSelf: false,
    damageType: DamageType.Frost,
    instantDamage: 3,
    slowDuration: 4000,
    slowAmount: 0.5,
    tintColor: 0x99ccff,
    projectile: {
      type: ProjectileType.FrostBoltProjectile,
      speed: 500,
      orientation: { randomizeOrientation: false, pointingOrientation: 270 },
      impactAnimation: { anims: ["frost_nova_impact"], tint: 0x99ccff }
    },
    castAnimation: AnimationType.Cast,
    sounds: { cast: "frost_cast", impact: "frost_slow" },
    icon: { key: "factions", frame: "spell_icons/frost_nova.png" },
    autocastDefault: true,
    requiresResearch: ResearchType.FrostNovaSpell
  },

  // ========== HEALING LIGHT - Single Target Instant Heal ==========
  [SpellType.HealingLight]: {
    type: SpellType.HealingLight,
    name: "Healing Light",
    description: "Instantly restores 30 health to a friendly unit",
    cooldown: 15000,
    range: 6,
    aoeRadius: 0,
    targetType: SpellTargetType.Actor,
    targetAllies: true,
    targetEnemies: false,
    targetSelf: true,
    instantHeal: 30,
    tintColor: 0x00ff88,
    castAnimation: AnimationType.Cast,
    sounds: { cast: "heal_cast", impact: "heal_apply" },
    icon: { key: "factions", frame: "spell_icons/healing_light.png" },
    autocastDefault: true,
    requiresResearch: ResearchType.HealingLightSpell
  },

  // ========== HEALING RAIN - AOE Heal Over Time Zone ==========
  [SpellType.HealingRain]: {
    type: SpellType.HealingRain,
    name: "Healing Rain",
    description: "Creates a healing zone that restores health to allies inside",
    cooldown: 60000,
    range: 8,
    aoeRadius: 4,
    targetType: SpellTargetType.Ground,
    targetAllies: true,
    targetEnemies: false,
    targetSelf: true,
    tintColor: 0x00ff88,
    persistentZone: {
      duration: 10000,
      tickInterval: 1000,
      visualEffect: "healing_rain_effect"
    },
    hotHeal: 5,
    hotTickInterval: 1000,
    hotDuration: 0,
    castAnimation: AnimationType.Cast,
    sounds: { cast: "heal_cast", loop: "rain_ambient" },
    icon: { key: "factions", frame: "spell_icons/healing_rain.png" },
    autocastDefault: false,
    requiresResearch: ResearchType.HealingRainSpell
  },

  // ========== HEALING TOTEM - Spawn Prefab ==========
  [SpellType.HealingTotem]: {
    type: SpellType.HealingTotem,
    name: "Healing Totem",
    description: "Summons a totem that heals nearby allies for 20 seconds",
    cooldown: 90000,
    range: 5,
    aoeRadius: 0,
    targetType: SpellTargetType.Ground,
    targetAllies: true,
    targetEnemies: false,
    targetSelf: false,
    tintColor: 0x00ff88,
    spawnPrefab: {
      prefabName: ObjectNames.HealingTotem,
      duration: 20000,
      inheritOwner: true
    },
    castAnimation: AnimationType.Cast,
    sounds: { cast: "totem_summon" },
    icon: { key: "factions", frame: "spell_icons/healing_totem.png" },
    autocastDefault: false,
    requiresResearch: ResearchType.HealingTotemSpell
  }
};
