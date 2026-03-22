import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_MEDUSA_DEATH_E = "mobs_medusa_death/e";
const ANIM_MOBS_MEDUSA_DEATH_N = "mobs_medusa_death/n";
const ANIM_MOBS_MEDUSA_DEATH_S = "mobs_medusa_death/s";
const ANIM_MOBS_MEDUSA_DEATH_W = "mobs_medusa_death/w";
const ANIM_MOBS_MEDUSA_GAZE_ATTACK_E = "mobs_medusa_gaze attack/e";
const ANIM_MOBS_MEDUSA_GAZE_ATTACK_N = "mobs_medusa_gaze attack/n";
const ANIM_MOBS_MEDUSA_GAZE_ATTACK_S = "mobs_medusa_gaze attack/s";
const ANIM_MOBS_MEDUSA_GAZE_ATTACK_W = "mobs_medusa_gaze attack/w";
const ANIM_MOBS_MEDUSA_HIT_E = "mobs_medusa_hit/e";
const ANIM_MOBS_MEDUSA_HIT_N = "mobs_medusa_hit/n";
const ANIM_MOBS_MEDUSA_HIT_S = "mobs_medusa_hit/s";
const ANIM_MOBS_MEDUSA_HIT_W = "mobs_medusa_hit/w";
const ANIM_MOBS_MEDUSA_IDLE_E = "mobs_medusa_idle/e";
const ANIM_MOBS_MEDUSA_IDLE_N = "mobs_medusa_idle/n";
const ANIM_MOBS_MEDUSA_IDLE_S = "mobs_medusa_idle/s";
const ANIM_MOBS_MEDUSA_IDLE_W = "mobs_medusa_idle/w";
const ANIM_MOBS_MEDUSA_MOVE_E = "mobs_medusa_move/e";
const ANIM_MOBS_MEDUSA_MOVE_N = "mobs_medusa_move/n";
const ANIM_MOBS_MEDUSA_MOVE_S = "mobs_medusa_move/s";
const ANIM_MOBS_MEDUSA_MOVE_W = "mobs_medusa_move/w";
const ANIM_MOBS_MEDUSA_SNAKE_ATTACK_E = "mobs_medusa_snake attack/e";
const ANIM_MOBS_MEDUSA_SNAKE_ATTACK_N = "mobs_medusa_snake attack/n";
const ANIM_MOBS_MEDUSA_SNAKE_ATTACK_S = "mobs_medusa_snake attack/s";
const ANIM_MOBS_MEDUSA_SNAKE_ATTACK_W = "mobs_medusa_snake attack/w";

export enum MedusaAnimationTypes {
  GazeAttack = "GazeAttack",
  SnakeAttack = "SnakeAttack"
}

export const ANIM_MEDUSA_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_MEDUSA_IDLE_S },
    north: { key: ANIM_MOBS_MEDUSA_IDLE_N },
    west: { key: ANIM_MOBS_MEDUSA_IDLE_W },
    east: { key: ANIM_MOBS_MEDUSA_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_MEDUSA_MOVE_S },
    north: { key: ANIM_MOBS_MEDUSA_MOVE_N },
    west: { key: ANIM_MOBS_MEDUSA_MOVE_W },
    east: { key: ANIM_MOBS_MEDUSA_MOVE_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_MEDUSA_DEATH_S },
    north: { key: ANIM_MOBS_MEDUSA_DEATH_N },
    west: { key: ANIM_MOBS_MEDUSA_DEATH_W },
    east: { key: ANIM_MOBS_MEDUSA_DEATH_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_MEDUSA_HIT_S },
    north: { key: ANIM_MOBS_MEDUSA_HIT_N },
    west: { key: ANIM_MOBS_MEDUSA_HIT_W },
    east: { key: ANIM_MOBS_MEDUSA_HIT_E }
  },
  [MedusaAnimationTypes.GazeAttack]: {
    south: { key: ANIM_MOBS_MEDUSA_GAZE_ATTACK_S },
    north: { key: ANIM_MOBS_MEDUSA_GAZE_ATTACK_N },
    west: { key: ANIM_MOBS_MEDUSA_GAZE_ATTACK_W },
    east: { key: ANIM_MOBS_MEDUSA_GAZE_ATTACK_E }
  },
  [MedusaAnimationTypes.SnakeAttack]: {
    south: { key: ANIM_MOBS_MEDUSA_SNAKE_ATTACK_S },
    north: { key: ANIM_MOBS_MEDUSA_SNAKE_ATTACK_N },
    west: { key: ANIM_MOBS_MEDUSA_SNAKE_ATTACK_W },
    east: { key: ANIM_MOBS_MEDUSA_SNAKE_ATTACK_E }
  }
};
