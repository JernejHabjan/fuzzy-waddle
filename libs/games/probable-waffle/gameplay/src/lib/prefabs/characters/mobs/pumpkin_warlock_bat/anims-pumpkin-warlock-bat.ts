import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const APPEAR_E = "mobs_pumpkin_warlock_Bat/bat - appear/e";
const APPEAR_N = "mobs_pumpkin_warlock_Bat/bat - appear/n";
const APPEAR_S = "mobs_pumpkin_warlock_Bat/bat - appear/s";
const APPEAR_W = "mobs_pumpkin_warlock_Bat/bat - appear/w";
const DEATH_E = "mobs_pumpkin_warlock_Bat/bat - death/e";
const DEATH_N = "mobs_pumpkin_warlock_Bat/bat - death/n";
const DEATH_S = "mobs_pumpkin_warlock_Bat/bat - death/s";
const DEATH_W = "mobs_pumpkin_warlock_Bat/bat - death/w";
const FLY_E = "mobs_pumpkin_warlock_Bat/bat - fly/e";
const FLY_N = "mobs_pumpkin_warlock_Bat/bat - fly/n";
const FLY_S = "mobs_pumpkin_warlock_Bat/bat - fly/s";
const FLY_W = "mobs_pumpkin_warlock_Bat/bat - fly/w";
const HIT_E = "mobs_pumpkin_warlock_Bat/bat - hit/e";
const HIT_N = "mobs_pumpkin_warlock_Bat/bat - hit/n";
const HIT_S = "mobs_pumpkin_warlock_Bat/bat - hit/s";
const HIT_W = "mobs_pumpkin_warlock_Bat/bat - hit/w";

export enum PumpkinWarlockBatAnimationTypes {
  Appear = "Appear",
  Fly = "Fly"
}

export const ANIM_PUMPKIN_WARLOCK_BAT_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: FLY_S },
    north: { key: FLY_N },
    west: { key: FLY_W },
    east: { key: FLY_E }
  },
  [AnimationType.Walk]: {
    south: { key: FLY_S },
    north: { key: FLY_N },
    west: { key: FLY_W },
    east: { key: FLY_E }
  },
  [AnimationType.Death]: {
    south: { key: DEATH_S },
    north: { key: DEATH_N },
    west: { key: DEATH_W },
    east: { key: DEATH_E }
  },
  [PumpkinWarlockBatAnimationTypes.Appear]: {
    south: { key: APPEAR_S },
    north: { key: APPEAR_N },
    west: { key: APPEAR_W },
    east: { key: APPEAR_E }
  },
  [PumpkinWarlockBatAnimationTypes.Fly]: {
    south: { key: FLY_S },
    north: { key: FLY_N },
    west: { key: FLY_W },
    east: { key: FLY_E }
  },
  [AnimationType.Damage]: {
    south: { key: HIT_S },
    north: { key: HIT_N },
    west: { key: HIT_W },
    east: { key: HIT_E }
  }
};
