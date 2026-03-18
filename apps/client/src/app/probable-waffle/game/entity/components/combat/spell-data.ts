import { SpellType } from "./spell-type";
import { DamageType, type ObjectNames, ResearchType, SpellTargetType } from "@fuzzy-waddle/api-interfaces";
import type { ProjectileData } from "./projectile-data";
import { AnimationType } from "../animation/animation-type";

export interface SpellData {
  type: SpellType;
  name: string;
  description: string;
  cooldown: number; // ms between casts. Must be non-zero positive integer
  range: number; // tiles (0 for self-cast)
  aoeRadius: number; // tiles (0 for single-target)
  targetType: SpellTargetType;
  targetAllies: boolean; // can target/affect allies
  targetEnemies: boolean; // can target/affect enemies
  targetSelf: boolean; // can target self

  // Damage effects
  damageType?: DamageType;
  instantDamage?: number; // one-time damage on impact
  dotDamage?: number; // damage per tick
  dotTickInterval?: number; // ms between damage ticks
  dotDuration?: number; // total DoT duration

  // Healing effects
  instantHeal?: number; // one-time heal on impact
  hotHeal?: number; // heal per tick (Heal over Time)
  hotTickInterval?: number; // ms between heal ticks
  hotDuration?: number; // total HoT duration

  // Status effects
  stunDuration?: number; // stun duration (0 = no stun)
  slowDuration?: number; // slow duration
  slowAmount?: number; // 0.5 = 50% slower
  tintColor?: number; // visual tint for affected actors

  // Persistent AOE zone (spell creates a lasting area effect)
  persistentZone?: {
    duration: number; // how long zone lasts (ms)
    tickInterval: number; // how often zone applies effects
    visualEffect?: string; // zone visual animation
  };

  // Spawn prefab (summon totem, turret, etc.)
  spawnPrefab?: {
    prefabName: ObjectNames; // which prefab to spawn
    duration?: number; // how long it lasts (undefined = permanent until killed)
    inheritOwner: boolean; // spawned unit belongs to caster's player
  };

  // Visual & Audio
  projectile?: ProjectileData;
  impactAnimation?: string;
  castAnimation?: AnimationType;
  sounds?: { cast?: string; impact?: string; loop?: string };
  icon: { key: string; frame: string };

  // Research & Autocast
  autocastDefault?: boolean; // default autocast state (default: true)
  requiresResearch?: ResearchType; // Research required to unlock this spell
}
