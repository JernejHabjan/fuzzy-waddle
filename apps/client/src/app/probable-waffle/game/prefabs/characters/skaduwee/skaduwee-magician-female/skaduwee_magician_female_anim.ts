import { AnimationType } from "../../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

const ANIM_MAGICIAN_FEMALE_LVL1_HURT = "magician_female_lvl1_hurt";
const ANIM_MAGICIAN_FEMALE_LVL1_IDLE = "magician_female_lvl1_idle";
const ANIM_MAGICIAN_FEMALE_LVL1_IDLE_1 = "magician_female_lvl1_idle_1";
const ANIM_MAGICIAN_FEMALE_LVL1_IDLE_2 = "magician_female_lvl1_idle_2";
const ANIM_MAGICIAN_FEMALE_LVL1_IDLE_3 = "magician_female_lvl1_idle_3";
const ANIM_MAGICIAN_FEMALE_LVL1_CAST = "magician_female_lvl1_cast";
const ANIM_MAGICIAN_FEMALE_LVL1_CAST_1 = "magician_female_lvl1_cast_1";
const ANIM_MAGICIAN_FEMALE_LVL1_CAST_2 = "magician_female_lvl1_cast_2";
const ANIM_MAGICIAN_FEMALE_LVL1_CAST_3 = "magician_female_lvl1_cast_3";
const ANIM_MAGICIAN_FEMALE_LVL1_THRUST = "magician_female_lvl1_thrust";
const ANIM_MAGICIAN_FEMALE_LVL1_THRUST_1 = "magician_female_lvl1_thrust_1";
const ANIM_MAGICIAN_FEMALE_LVL1_THRUST_2 = "magician_female_lvl1_thrust_2";
const ANIM_MAGICIAN_FEMALE_LVL1_THRUST_3 = "magician_female_lvl1_thrust_3";
const ANIM_MAGICIAN_FEMALE_LVL1_WALK = "magician_female_lvl1_walk";
const ANIM_MAGICIAN_FEMALE_LVL1_WALK_1 = "magician_female_lvl1_walk_1";
const ANIM_MAGICIAN_FEMALE_LVL1_WALK_2 = "magician_female_lvl1_walk_2";
const ANIM_MAGICIAN_FEMALE_LVL1_WALK_3 = "magician_female_lvl1_walk_3";
const ANIM_MAGICIAN_FEMALE_LVL2_HURT = "magician_female_lvl2_hurt";
const ANIM_MAGICIAN_FEMALE_LVL2_IDLE = "magician_female_lvl2_idle";
const ANIM_MAGICIAN_FEMALE_LVL2_IDLE_1 = "magician_female_lvl2_idle_1";
const ANIM_MAGICIAN_FEMALE_LVL2_IDLE_2 = "magician_female_lvl2_idle_2";
const ANIM_MAGICIAN_FEMALE_LVL2_IDLE_3 = "magician_female_lvl2_idle_3";
const ANIM_MAGICIAN_FEMALE_LVL2_CAST = "magician_female_lvl2_cast";
const ANIM_MAGICIAN_FEMALE_LVL2_CAST_1 = "magician_female_lvl2_cast_1";
const ANIM_MAGICIAN_FEMALE_LVL2_CAST_2 = "magician_female_lvl2_cast_2";
const ANIM_MAGICIAN_FEMALE_LVL2_CAST_3 = "magician_female_lvl2_cast_3";
const ANIM_MAGICIAN_FEMALE_LVL2_THRUST = "magician_female_lvl2_thrust";
const ANIM_MAGICIAN_FEMALE_LVL2_THRUST_1 = "magician_female_lvl2_thrust_1";
const ANIM_MAGICIAN_FEMALE_LVL2_THRUST_2 = "magician_female_lvl2_thrust_2";
const ANIM_MAGICIAN_FEMALE_LVL2_THRUST_3 = "magician_female_lvl2_thrust_3";
const ANIM_MAGICIAN_FEMALE_LVL2_WALK = "magician_female_lvl2_walk";
const ANIM_MAGICIAN_FEMALE_LVL2_WALK_1 = "magician_female_lvl2_walk_1";
const ANIM_MAGICIAN_FEMALE_LVL2_WALK_2 = "magician_female_lvl2_walk_2";
const ANIM_MAGICIAN_FEMALE_LVL2_WALK_3 = "magician_female_lvl2_walk_3";
const ANIM_MAGICIAN_FEMALE_LVL3_HURT = "magician_female_lvl3_hurt";
const ANIM_MAGICIAN_FEMALE_LVL3_IDLE = "magician_female_lvl3_idle";
const ANIM_MAGICIAN_FEMALE_LVL3_IDLE_1 = "magician_female_lvl3_idle_1";
const ANIM_MAGICIAN_FEMALE_LVL3_IDLE_2 = "magician_female_lvl3_idle_2";
const ANIM_MAGICIAN_FEMALE_LVL3_IDLE_3 = "magician_female_lvl3_idle_3";
const ANIM_MAGICIAN_FEMALE_LVL3_CAST = "magician_female_lvl3_cast";
const ANIM_MAGICIAN_FEMALE_LVL3_CAST_1 = "magician_female_lvl3_cast_1";
const ANIM_MAGICIAN_FEMALE_LVL3_CAST_2 = "magician_female_lvl3_cast_2";
const ANIM_MAGICIAN_FEMALE_LVL3_CAST_3 = "magician_female_lvl3_cast_3";
const ANIM_MAGICIAN_FEMALE_LVL3_THRUST = "magician_female_lvl3_thrust";
const ANIM_MAGICIAN_FEMALE_LVL3_THRUST_1 = "magician_female_lvl3_thrust_1";
const ANIM_MAGICIAN_FEMALE_LVL3_THRUST_2 = "magician_female_lvl3_thrust_2";
const ANIM_MAGICIAN_FEMALE_LVL3_THRUST_3 = "magician_female_lvl3_thrust_3";
const ANIM_MAGICIAN_FEMALE_LVL3_WALK = "magician_female_lvl3_walk";
const ANIM_MAGICIAN_FEMALE_LVL3_WALK_1 = "magician_female_lvl3_walk_1";
const ANIM_MAGICIAN_FEMALE_LVL3_WALK_2 = "magician_female_lvl3_walk_2";
const ANIM_MAGICIAN_FEMALE_LVL3_WALK_3 = "magician_female_lvl3_walk_3";

export const ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_1: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL1_IDLE },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL1_IDLE_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL1_IDLE_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL1_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL1_WALK },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL1_WALK_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL1_WALK_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL1_WALK_3 }
  },
  [AnimationType.Cast]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL1_CAST },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL1_CAST_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL1_CAST_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL1_CAST_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL1_THRUST },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL1_THRUST_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL1_THRUST_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL1_THRUST_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL1_HURT },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL1_HURT },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL1_HURT },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL1_HURT }
  }
};
export const ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_2: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL2_IDLE },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL2_IDLE_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL2_IDLE_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL2_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL2_WALK },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL2_WALK_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL2_WALK_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL2_WALK_3 }
  },
  [AnimationType.Cast]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL2_CAST },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL2_CAST_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL2_CAST_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL2_CAST_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL2_THRUST },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL2_THRUST_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL2_THRUST_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL2_THRUST_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL2_HURT },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL2_HURT },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL2_HURT },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL2_HURT }
  }
};
export const ANIM_SKADUWEE_MAGICIAN_FEMALE_DEFINITION_LEVEL_3: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL3_IDLE },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL3_IDLE_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL3_IDLE_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL3_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL3_WALK },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL3_WALK_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL3_WALK_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL3_WALK_3 }
  },
  [AnimationType.Cast]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL3_CAST },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL3_CAST_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL3_CAST_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL3_CAST_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL3_THRUST },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL3_THRUST_2 },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL3_THRUST_1 },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL3_THRUST_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_MAGICIAN_FEMALE_LVL3_HURT },
    south: { key: ANIM_MAGICIAN_FEMALE_LVL3_HURT },
    west: { key: ANIM_MAGICIAN_FEMALE_LVL3_HURT },
    east: { key: ANIM_MAGICIAN_FEMALE_LVL3_HURT }
  }
};
