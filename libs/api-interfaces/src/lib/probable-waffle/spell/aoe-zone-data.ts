import type { StatusEffectData } from '../status-effect';

export interface AoeZoneData {
  id: string; // unique zone ID
  spellType: string; // which spell created this (SpellType enum value)
  position: { x: number; y: number }; // world position
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
  sourcePlayerId: number; // who created this zone
  lastTickTime?: number; // timestamp of last tick
}
