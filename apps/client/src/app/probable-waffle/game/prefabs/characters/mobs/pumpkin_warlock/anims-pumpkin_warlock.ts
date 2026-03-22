import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ATTACK_E = "mobs_pumpkin_warlock_Warlock/attack/e";
const ATTACK_N = "mobs_pumpkin_warlock_Warlock/attack/n";
const ATTACK_S = "mobs_pumpkin_warlock_Warlock/attack/s";
const ATTACK_W = "mobs_pumpkin_warlock_Warlock/attack/w";
const CAST_E = "mobs_pumpkin_warlock_Warlock/cast/e";
const CAST_N = "mobs_pumpkin_warlock_Warlock/cast/n";
const CAST_S = "mobs_pumpkin_warlock_Warlock/cast/s";
const CAST_W = "mobs_pumpkin_warlock_Warlock/cast/w";
const DEATH_E = "mobs_pumpkin_warlock_Warlock/death/e";
const DEATH_N = "mobs_pumpkin_warlock_Warlock/death/n";
const DEATH_S = "mobs_pumpkin_warlock_Warlock/death/s";
const DEATH_W = "mobs_pumpkin_warlock_Warlock/death/w";
const HIT_E = "mobs_pumpkin_warlock_Warlock/hit/e";
const HIT_N = "mobs_pumpkin_warlock_Warlock/hit/n";
const HIT_S = "mobs_pumpkin_warlock_Warlock/hit/s";
const HIT_W = "mobs_pumpkin_warlock_Warlock/hit/w";
const IDLE_E = "mobs_pumpkin_warlock_Warlock/idle/e";
const IDLE_N = "mobs_pumpkin_warlock_Warlock/idle/n";
const IDLE_S = "mobs_pumpkin_warlock_Warlock/idle/s";
const IDLE_W = "mobs_pumpkin_warlock_Warlock/idle/w";
const SPELL = "mobs_pumpkin_warlock_Warlock/spell";
const SUMMON_BAT_E = "mobs_pumpkin_warlock_Warlock/summon bat/e";
const SUMMON_BAT_N = "mobs_pumpkin_warlock_Warlock/summon bat/n";
const SUMMON_BAT_S = "mobs_pumpkin_warlock_Warlock/summon bat/s";
const SUMMON_BAT_W = "mobs_pumpkin_warlock_Warlock/summon bat/w";
const WALK_E = "mobs_pumpkin_warlock_Warlock/walk/e";
const WALK_N = "mobs_pumpkin_warlock_Warlock/walk/n";
const WALK_S = "mobs_pumpkin_warlock_Warlock/walk/s";
const WALK_W = "mobs_pumpkin_warlock_Warlock/walk/w";

export enum PumpkinWarlockAnimationTypes {
  SummonBat = "SummonBat",
  Spell = "Spell"
}

export const ANIM_PUMPKIN_WARLOCK_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: IDLE_S },
    north: { key: IDLE_N },
    west: { key: IDLE_W },
    east: { key: IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: WALK_S },
    north: { key: WALK_N },
    west: { key: WALK_W },
    east: { key: WALK_E }
  },
  [AnimationType.Cast]: {
    south: { key: CAST_S },
    north: { key: CAST_N },
    west: { key: CAST_W },
    east: { key: CAST_E }
  },
  [AnimationType.Death]: {
    south: { key: DEATH_S },
    north: { key: DEATH_N },
    west: { key: DEATH_W },
    east: { key: DEATH_E }
  },
  [AnimationType.Thrust]: {
    south: { key: ATTACK_S },
    north: { key: ATTACK_N },
    west: { key: ATTACK_W },
    east: { key: ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: HIT_S },
    north: { key: HIT_N },
    west: { key: HIT_W },
    east: { key: HIT_E }
  },
  [PumpkinWarlockAnimationTypes.SummonBat]: {
    south: { key: SUMMON_BAT_S },
    north: { key: SUMMON_BAT_N },
    west: { key: SUMMON_BAT_W },
    east: { key: SUMMON_BAT_E }
  },
  [PumpkinWarlockAnimationTypes.Spell]: {
    south: { key: SPELL },
    north: { key: SPELL },
    west: { key: SPELL },
    east: { key: SPELL }
  }
};
