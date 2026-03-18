import type { StatusEffectData } from "../status-effect";
import type { Vector2Simple } from "../../game/vector";

export interface AoeZoneData {
  id: string; // unique zone ID
  spellType: string; // which spell created this (SpellType enum value)
  worldPosition: Vector2Simple; // world position
  radius: number; // tiles
  duration: number; // total duration in ms
  remainingTime: number; // remaining time in ms
  tickInterval: number; // how often to apply effects
  effectOnEnter?: StatusEffectData; // effect applied when unit enters
  effectWhileInside?: StatusEffectData; // effect reapplied each tick while inside
  affectsAllies: boolean; // can affect friendly units
  affectsEnemies: boolean; // can affect enemy units
  visualEffect?: string; // animation/particle effect name
  tintColor?: number; // zone tint color
  sounds?: { cast?: string; impact?: string; loop?: string }; // sound effects
  sourcePlayerId: number; // who created this zone
  lastTickTime?: number; // timestamp of last tick
}
