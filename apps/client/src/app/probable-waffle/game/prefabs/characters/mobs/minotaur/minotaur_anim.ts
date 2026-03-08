import { type AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MINOTAUR_HURT = "minotaur_hurt";
const ANIM_MINOTAUR_IDLE = "minotaur_idle";
const ANIM_MINOTAUR_IDLE_1 = "minotaur_idle_1";
const ANIM_MINOTAUR_IDLE_2 = "minotaur_idle_2";
const ANIM_MINOTAUR_IDLE_3 = "minotaur_idle_3";
const ANIM_MINOTAUR_SLASH = "minotaur_slash";
const ANIM_MINOTAUR_SLASH_1 = "minotaur_slash_1";
const ANIM_MINOTAUR_SLASH_2 = "minotaur_slash_2";
const ANIM_MINOTAUR_SLASH_3 = "minotaur_slash_3";
const ANIM_MINOTAUR_THRUST = "minotaur_thrust";
const ANIM_MINOTAUR_THRUST_1 = "minotaur_thrust_1";
const ANIM_MINOTAUR_THRUST_2 = "minotaur_thrust_2";
const ANIM_MINOTAUR_THRUST_3 = "minotaur_thrust_3";
const ANIM_MINOTAUR_WALK = "minotaur_walk";
const ANIM_MINOTAUR_WALK_1 = "minotaur_walk_1";
const ANIM_MINOTAUR_WALK_2 = "minotaur_walk_2";
const ANIM_MINOTAUR_WALK_3 = "minotaur_walk_3";

export const ANIM_MINOTAUR_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_MINOTAUR_IDLE },
    south: { key: ANIM_MINOTAUR_IDLE_2 },
    west: { key: ANIM_MINOTAUR_IDLE_1 },
    east: { key: ANIM_MINOTAUR_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_MINOTAUR_WALK },
    south: { key: ANIM_MINOTAUR_WALK_2 },
    west: { key: ANIM_MINOTAUR_WALK_1 },
    east: { key: ANIM_MINOTAUR_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_MINOTAUR_SLASH },
    south: { key: ANIM_MINOTAUR_SLASH_2 },
    west: { key: ANIM_MINOTAUR_SLASH_1 },
    east: { key: ANIM_MINOTAUR_SLASH_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_MINOTAUR_THRUST },
    south: { key: ANIM_MINOTAUR_THRUST_2 },
    west: { key: ANIM_MINOTAUR_THRUST_1 },
    east: { key: ANIM_MINOTAUR_THRUST_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_MINOTAUR_HURT },
    south: { key: ANIM_MINOTAUR_HURT },
    west: { key: ANIM_MINOTAUR_HURT },
    east: { key: ANIM_MINOTAUR_HURT }
  }
};
