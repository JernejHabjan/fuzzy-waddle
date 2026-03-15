import { AnimationType } from "../../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

const ANIM_SLINGSHOT_FEMALE_LVL1_HURT = "slingshot_female_lvl1_long_range_hurt";
const ANIM_SLINGSHOT_FEMALE_LVL1_IDLE = "slingshot_female_lvl1_long_range_idle";
const ANIM_SLINGSHOT_FEMALE_LVL1_IDLE_1 = "slingshot_female_lvl1_long_range_idle_1";
const ANIM_SLINGSHOT_FEMALE_LVL1_IDLE_2 = "slingshot_female_lvl1_long_range_idle_2";
const ANIM_SLINGSHOT_FEMALE_LVL1_IDLE_3 = "slingshot_female_lvl1_long_range_idle_3";
const ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT = "slingshot_female_lvl1_long_range_shoot";
const ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT_1 = "slingshot_female_lvl1_long_range_shoot_1";
const ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT_2 = "slingshot_female_lvl1_long_range_shoot_2";
const ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT_3 = "slingshot_female_lvl1_long_range_shoot_3";
const ANIM_SLINGSHOT_FEMALE_LVL1_WALK = "slingshot_female_lvl1_long_range_walk";
const ANIM_SLINGSHOT_FEMALE_LVL1_WALK_1 = "slingshot_female_lvl1_long_range_walk_1";
const ANIM_SLINGSHOT_FEMALE_LVL1_WALK_2 = "slingshot_female_lvl1_long_range_walk_2";
const ANIM_SLINGSHOT_FEMALE_LVL1_WALK_3 = "slingshot_female_lvl1_long_range_walk_3";
const ANIM_SLINGSHOT_FEMALE_LVL1_THRUST = "slingshot_female_lvl1_short_range_thrust";
const ANIM_SLINGSHOT_FEMALE_LVL1_THRUST_1 = "slingshot_female_lvl1_short_range_thrust_1";
const ANIM_SLINGSHOT_FEMALE_LVL1_THRUST_2 = "slingshot_female_lvl1_short_range_thrust_2";
const ANIM_SLINGSHOT_FEMALE_LVL1_THRUST_3 = "slingshot_female_lvl1_short_range_thrust_3";
const ANIM_SLINGSHOT_FEMALE_LVL2_HURT = "slingshot_female_lvl2_long_range_hurt";
const ANIM_SLINGSHOT_FEMALE_LVL2_IDLE = "slingshot_female_lvl2_long_range_idle";
const ANIM_SLINGSHOT_FEMALE_LVL2_IDLE_1 = "slingshot_female_lvl2_long_range_idle_1";
const ANIM_SLINGSHOT_FEMALE_LVL2_IDLE_2 = "slingshot_female_lvl2_long_range_idle_2";
const ANIM_SLINGSHOT_FEMALE_LVL2_IDLE_3 = "slingshot_female_lvl2_long_range_idle_3";
const ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT = "slingshot_female_lvl2_long_range_shoot";
const ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT_1 = "slingshot_female_lvl2_long_range_shoot_1";
const ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT_2 = "slingshot_female_lvl2_long_range_shoot_2";
const ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT_3 = "slingshot_female_lvl2_long_range_shoot_3";
const ANIM_SLINGSHOT_FEMALE_LVL2_WALK = "slingshot_female_lvl2_long_range_walk";
const ANIM_SLINGSHOT_FEMALE_LVL2_WALK_1 = "slingshot_female_lvl2_long_range_walk_1";
const ANIM_SLINGSHOT_FEMALE_LVL2_WALK_2 = "slingshot_female_lvl2_long_range_walk_2";
const ANIM_SLINGSHOT_FEMALE_LVL2_WALK_3 = "slingshot_female_lvl2_long_range_walk_3";
const ANIM_SLINGSHOT_FEMALE_LVL2_THRUST = "slingshot_female_lvl2_short_range_thrust";
const ANIM_SLINGSHOT_FEMALE_LVL2_THRUST_1 = "slingshot_female_lvl2_short_range_thrust_1";
const ANIM_SLINGSHOT_FEMALE_LVL2_THRUST_2 = "slingshot_female_lvl2_short_range_thrust_2";
const ANIM_SLINGSHOT_FEMALE_LVL2_THRUST_3 = "slingshot_female_lvl2_short_range_thrust_3";
const ANIM_SLINGSHOT_FEMALE_LVL3_HURT = "slingshot_female_lvl3_long_range_hurt";
const ANIM_SLINGSHOT_FEMALE_LVL3_IDLE = "slingshot_female_lvl3_long_range_idle";
const ANIM_SLINGSHOT_FEMALE_LVL3_IDLE_1 = "slingshot_female_lvl3_long_range_idle_1";
const ANIM_SLINGSHOT_FEMALE_LVL3_IDLE_2 = "slingshot_female_lvl3_long_range_idle_2";
const ANIM_SLINGSHOT_FEMALE_LVL3_IDLE_3 = "slingshot_female_lvl3_long_range_idle_3";
const ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT = "slingshot_female_lvl3_long_range_shoot";
const ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT_1 = "slingshot_female_lvl3_long_range_shoot_1";
const ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT_2 = "slingshot_female_lvl3_long_range_shoot_2";
const ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT_3 = "slingshot_female_lvl3_long_range_shoot_3";
const ANIM_SLINGSHOT_FEMALE_LVL3_WALK = "slingshot_female_lvl3_long_range_walk";
const ANIM_SLINGSHOT_FEMALE_LVL3_WALK_1 = "slingshot_female_lvl3_long_range_walk_1";
const ANIM_SLINGSHOT_FEMALE_LVL3_WALK_2 = "slingshot_female_lvl3_long_range_walk_2";
const ANIM_SLINGSHOT_FEMALE_LVL3_WALK_3 = "slingshot_female_lvl3_long_range_walk_3";
const ANIM_SLINGSHOT_FEMALE_LVL3_THRUST = "slingshot_female_lvl3_short_range_thrust";
const ANIM_SLINGSHOT_FEMALE_LVL3_THRUST_1 = "slingshot_female_lvl3_short_range_thrust_1";
const ANIM_SLINGSHOT_FEMALE_LVL3_THRUST_2 = "slingshot_female_lvl3_short_range_thrust_2";
const ANIM_SLINGSHOT_FEMALE_LVL3_THRUST_3 = "slingshot_female_lvl3_short_range_thrust_3";

export const ANIM_TIVARA_MACEMAN_MALE_DEFINITION_LEVEL_1: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL1_IDLE },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL1_IDLE_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL1_IDLE_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL1_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL1_WALK },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL1_WALK_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL1_WALK_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL1_WALK_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL1_THRUST },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL1_THRUST_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL1_THRUST_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL1_THRUST_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL1_SHOOT_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL1_HURT },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL1_HURT },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL1_HURT },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL1_HURT }
  }
};
export const ANIM_TIVARA_MACEMAN_MALE_DEFINITION_LEVEL_2: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL2_IDLE },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL2_IDLE_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL2_IDLE_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL2_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL2_WALK },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL2_WALK_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL2_WALK_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL2_WALK_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL2_THRUST },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL2_THRUST_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL2_THRUST_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL2_THRUST_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL2_SHOOT_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL2_HURT },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL2_HURT },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL2_HURT },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL2_HURT }
  }
};
export const ANIM_TIVARA_MACEMAN_MALE_DEFINITION_LEVEL_3: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL3_IDLE },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL3_IDLE_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL3_IDLE_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL3_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL3_WALK },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL3_WALK_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL3_WALK_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL3_WALK_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL3_THRUST },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL3_THRUST_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL3_THRUST_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL3_THRUST_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT_2 },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT_1 },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL3_SHOOT_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SLINGSHOT_FEMALE_LVL3_HURT },
    south: { key: ANIM_SLINGSHOT_FEMALE_LVL3_HURT },
    west: { key: ANIM_SLINGSHOT_FEMALE_LVL3_HURT },
    east: { key: ANIM_SLINGSHOT_FEMALE_LVL3_HURT }
  }
};
