import { StatusEffectType } from "./status-effect-type";
import { DamageType } from "./damage-type";
import type { ActorId } from "../../game-instance/player/player";

export interface StatusEffectData {
  type: StatusEffectType;
  duration: number; // total duration in ms
  remainingTime: number; // remaining time in ms
  damageType?: DamageType; // uses DamageType enum (Physical, Frost, Fire, Poison)
  damagePerTick?: number; // for DoT effects (negative = damage)
  healPerTick?: number; // for HoT effects (positive = heal)
  tickInterval?: number; // ms between damage/heal ticks
  instantDamage?: number; // one-time damage on apply
  instantHeal?: number; // one-time heal on apply
  movementSpeedModifier?: number; // 0.5 = 50% slower, 1.5 = 50% faster
  sourceActorId?: ActorId; // who applied the effect
  tintColor?: number; // visual tint (0x6666FF for frost, 0xFF6600 for fire)
  lastTickTime?: number; // timestamp of last tick
}
