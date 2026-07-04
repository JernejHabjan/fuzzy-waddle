import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const APPEAR_E = "mobs_banshee_appear/e";
const APPEAR_N = "mobs_banshee_appear/n";
const APPEAR_S = "mobs_banshee_appear/s";
const APPEAR_W = "mobs_banshee_appear/w";
const ATTACK_E = "mobs_banshee_attack/e";
const ATTACK_N = "mobs_banshee_attack/n";
const ATTACK_S = "mobs_banshee_attack/s";
const ATTACK_W = "mobs_banshee_attack/w";
const DEATH_E = "mobs_banshee_death/e";
const DEATH_N = "mobs_banshee_death/n";
const DEATH_S = "mobs_banshee_death/s";
const DEATH_W = "mobs_banshee_death/w";
const DISAPPEAR_E = "mobs_banshee_disappear/e";
const DISAPPEAR_N = "mobs_banshee_disappear/n";
const DISAPPEAR_S = "mobs_banshee_disappear/s";
const DISAPPEAR_W = "mobs_banshee_disappear/w";
const HIT_E = "mobs_banshee_hit/e";
const HIT_N = "mobs_banshee_hit/n";
const HIT_S = "mobs_banshee_hit/s";
const HIT_W = "mobs_banshee_hit/w";
const IDLE_E = "mobs_banshee_idle/e";
const IDLE_N = "mobs_banshee_idle/n";
const IDLE_S = "mobs_banshee_idle/s";
const IDLE_W = "mobs_banshee_idle/w";
const MOVE_E = "mobs_banshee_move/e";
const MOVE_N = "mobs_banshee_move/n";
const MOVE_S = "mobs_banshee_move/s";
const MOVE_W = "mobs_banshee_move/w";
const SCREAM_E = "mobs_banshee_scream/e";
const SCREAM_N = "mobs_banshee_scream/n";
const SCREAM_S = "mobs_banshee_scream/s";
const SCREAM_W = "mobs_banshee_scream/w";

export enum BansheeAnimationTypes {
  Appear = "Appear",
  Disappear = "Disappear",
  Scream = "Scream"
}

export const ANIM_BANSHEE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: IDLE_S },
    north: { key: IDLE_N },
    west: { key: IDLE_W },
    east: { key: IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: MOVE_S },
    north: { key: MOVE_N },
    west: { key: MOVE_W },
    east: { key: MOVE_E }
  },
  [AnimationType.Death]: {
    south: { key: DEATH_S },
    north: { key: DEATH_N },
    west: { key: DEATH_W },
    east: { key: DEATH_E }
  },
  [AnimationType.Slash]: {
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
  // Custom banshee:
  [BansheeAnimationTypes.Appear]: {
    south: { key: APPEAR_S },
    north: { key: APPEAR_N },
    west: { key: APPEAR_W },
    east: { key: APPEAR_E }
  },
  [BansheeAnimationTypes.Disappear]: {
    south: { key: DISAPPEAR_S },
    north: { key: DISAPPEAR_N },
    west: { key: DISAPPEAR_W },
    east: { key: DISAPPEAR_E }
  },
  [BansheeAnimationTypes.Scream]: {
    south: { key: SCREAM_S },
    north: { key: SCREAM_N },
    west: { key: SCREAM_W },
    east: { key: SCREAM_E }
  }
};
