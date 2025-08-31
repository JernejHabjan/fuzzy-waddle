import { type AnimationDefinitionMap } from "../../../entity/components/animation/animation-actor-component";
import { AnimationType } from "../../../entity/components/animation/animation-type";

const ANIM_HEDGEHOG_IDLE_RIGHT = "hedgehog_idle_right";
const ANIM_HEDGEHOG_IDLE_DOWN = "hedgehog_idle_down";
const ANIM_HEDGEHOG_IDLE_TOP = "hedgehog_idle_top";
const ANIM_HEDGEHOG_WALK_RIGHT = "hedgehog_walk_right";
const ANIM_HEDGEHOG_WALK_TOP = "hedgehog_walk_top";
const ANIM_HEDGEHOG_BALL_RIGHT = "hedgehog_ball_right";
const ANIM_HEDGEHOG_BALL_DOWN = "hedgehog_ball_down";
const ANIM_HEDGEHOG_BALL_TOP = "hedgehog_ball_top";
const ANIM_HEDGEHOG_IDLE_LEFT = "hedgehog_idle_left";
const ANIM_HEDGEHOG_WALK_LEFT = "hedgehog_walk_left";
const ANIM_HEDGEHOG_BALL_LEFT = "hedgehog_ball_left";
const ANIM_HEDGEHOG_WALK_DOWN = "hedgehog_walk_down";

export const ANIM_HEDGEHOG_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_HEDGEHOG_IDLE_TOP },
    south: { key: ANIM_HEDGEHOG_IDLE_DOWN },
    west: { key: ANIM_HEDGEHOG_IDLE_LEFT },
    east: { key: ANIM_HEDGEHOG_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_HEDGEHOG_WALK_TOP },
    south: { key: ANIM_HEDGEHOG_WALK_DOWN },
    west: { key: ANIM_HEDGEHOG_WALK_LEFT },
    east: { key: ANIM_HEDGEHOG_WALK_RIGHT }
  },
  ["ball"]: {
    north: { key: ANIM_HEDGEHOG_BALL_TOP },
    south: { key: ANIM_HEDGEHOG_BALL_DOWN },
    west: { key: ANIM_HEDGEHOG_BALL_LEFT },
    east: { key: ANIM_HEDGEHOG_BALL_RIGHT }
  }
};
