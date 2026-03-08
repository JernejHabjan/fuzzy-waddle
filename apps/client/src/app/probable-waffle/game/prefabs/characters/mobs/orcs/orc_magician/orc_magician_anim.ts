import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_ORC_MAGICIAN_HURT = "orc_magician_hurt";
const ANIM_ORC_MAGICIAN_IDLE = "orc_magician_idle";
const ANIM_ORC_MAGICIAN_IDLE_1 = "orc_magician_idle_1";
const ANIM_ORC_MAGICIAN_IDLE_2 = "orc_magician_idle_2";
const ANIM_ORC_MAGICIAN_IDLE_3 = "orc_magician_idle_3";
const ANIM_ORC_MAGICIAN_THRUST = "orc_magician_thrust";
const ANIM_ORC_MAGICIAN_THRUST_1 = "orc_magician_thrust_1";
const ANIM_ORC_MAGICIAN_THRUST_2 = "orc_magician_thrust_2";
const ANIM_ORC_MAGICIAN_THRUST_3 = "orc_magician_thrust_3";
const ANIM_ORC_MAGICIAN_WALK = "orc_magician_walk";
const ANIM_ORC_MAGICIAN_WALK_1 = "orc_magician_walk_1";
const ANIM_ORC_MAGICIAN_WALK_2 = "orc_magician_walk_2";
const ANIM_ORC_MAGICIAN_WALK_3 = "orc_magician_walk_3";
const ANIM_ORC_MAGICIAN_CAST = "orc_magician_cast";
const ANIM_ORC_MAGICIAN_CAST_1 = "orc_magician_cast_1";
const ANIM_ORC_MAGICIAN_CAST_2 = "orc_magician_cast_2";
const ANIM_ORC_MAGICIAN_CAST_3 = "orc_magician_cast_3";

export const ANIM_ORC_MAGICIAN_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ORC_MAGICIAN_IDLE },
    south: { key: ANIM_ORC_MAGICIAN_IDLE_2 },
    west: { key: ANIM_ORC_MAGICIAN_IDLE_1 },
    east: { key: ANIM_ORC_MAGICIAN_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_ORC_MAGICIAN_WALK },
    south: { key: ANIM_ORC_MAGICIAN_WALK_2 },
    west: { key: ANIM_ORC_MAGICIAN_WALK_1 },
    east: { key: ANIM_ORC_MAGICIAN_WALK_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_ORC_MAGICIAN_THRUST },
    south: { key: ANIM_ORC_MAGICIAN_THRUST_2 },
    west: { key: ANIM_ORC_MAGICIAN_THRUST_1 },
    east: { key: ANIM_ORC_MAGICIAN_THRUST_3 }
  },
  [AnimationType.Cast]: {
    north: { key: ANIM_ORC_MAGICIAN_CAST },
    south: { key: ANIM_ORC_MAGICIAN_CAST_2 },
    west: { key: ANIM_ORC_MAGICIAN_CAST_1 },
    east: { key: ANIM_ORC_MAGICIAN_CAST_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_ORC_MAGICIAN_HURT },
    south: { key: ANIM_ORC_MAGICIAN_HURT },
    west: { key: ANIM_ORC_MAGICIAN_HURT },
    east: { key: ANIM_ORC_MAGICIAN_HURT }
  }
};
