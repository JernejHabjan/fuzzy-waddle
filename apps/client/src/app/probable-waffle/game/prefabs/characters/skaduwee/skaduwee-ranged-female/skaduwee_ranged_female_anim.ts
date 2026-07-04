import { AnimationType } from "../../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

const ANIM_RANGED_FEMALE_LVL1_HURT = "ranged_female_lvl1_long_range_hurt";
const ANIM_RANGED_FEMALE_LVL1_IDLE = "ranged_female_lvl1_long_range_idle";
const ANIM_RANGED_FEMALE_LVL1_IDLE_1 = "ranged_female_lvl1_long_range_idle_1";
const ANIM_RANGED_FEMALE_LVL1_IDLE_2 = "ranged_female_lvl1_long_range_idle_2";
const ANIM_RANGED_FEMALE_LVL1_IDLE_3 = "ranged_female_lvl1_long_range_idle_3";
const ANIM_RANGED_FEMALE_LVL1_SHOOT = "ranged_female_lvl1_long_range_shoot";
const ANIM_RANGED_FEMALE_LVL1_SHOOT_1 = "ranged_female_lvl1_long_range_shoot_1";
const ANIM_RANGED_FEMALE_LVL1_SHOOT_2 = "ranged_female_lvl1_long_range_shoot_2";
const ANIM_RANGED_FEMALE_LVL1_SHOOT_3 = "ranged_female_lvl1_long_range_shoot_3";
const ANIM_RANGED_FEMALE_LVL1_WALK = "ranged_female_lvl1_long_range_walk";
const ANIM_RANGED_FEMALE_LVL1_WALK_1 = "ranged_female_lvl1_long_range_walk_1";
const ANIM_RANGED_FEMALE_LVL1_WALK_2 = "ranged_female_lvl1_long_range_walk_2";
const ANIM_RANGED_FEMALE_LVL1_WALK_3 = "ranged_female_lvl1_long_range_walk_3";
const ANIM_RANGED_FEMALE_LVL1_SLASH = "ranged_female_lvl1_short_range_slash";
const ANIM_RANGED_FEMALE_LVL1_SLASH_1 = "ranged_female_lvl1_short_range_slash_1";
const ANIM_RANGED_FEMALE_LVL1_SLASH_2 = "ranged_female_lvl1_short_range_slash_2";
const ANIM_RANGED_FEMALE_LVL1_SLASH_3 = "ranged_female_lvl1_short_range_slash_3";
const ANIM_RANGED_FEMALE_LVL2_HURT = "ranged_female_lvl2_long_range_hurt";
const ANIM_RANGED_FEMALE_LVL2_IDLE = "ranged_female_lvl2_long_range_idle";
const ANIM_RANGED_FEMALE_LVL2_IDLE_1 = "ranged_female_lvl2_long_range_idle_1";
const ANIM_RANGED_FEMALE_LVL2_IDLE_2 = "ranged_female_lvl2_long_range_idle_2";
const ANIM_RANGED_FEMALE_LVL2_IDLE_3 = "ranged_female_lvl2_long_range_idle_3";
const ANIM_RANGED_FEMALE_LVL2_SHOOT = "ranged_female_lvl2_long_range_shoot";
const ANIM_RANGED_FEMALE_LVL2_SHOOT_1 = "ranged_female_lvl2_long_range_shoot_1";
const ANIM_RANGED_FEMALE_LVL2_SHOOT_2 = "ranged_female_lvl2_long_range_shoot_2";
const ANIM_RANGED_FEMALE_LVL2_SHOOT_3 = "ranged_female_lvl2_long_range_shoot_3";
const ANIM_RANGED_FEMALE_LVL2_WALK = "ranged_female_lvl2_long_range_walk";
const ANIM_RANGED_FEMALE_LVL2_WALK_1 = "ranged_female_lvl2_long_range_walk_1";
const ANIM_RANGED_FEMALE_LVL2_WALK_2 = "ranged_female_lvl2_long_range_walk_2";
const ANIM_RANGED_FEMALE_LVL2_WALK_3 = "ranged_female_lvl2_long_range_walk_3";
const ANIM_RANGED_FEMALE_LVL2_SLASH = "ranged_female_lvl2_short_range_slash";
const ANIM_RANGED_FEMALE_LVL2_SLASH_1 = "ranged_female_lvl2_short_range_slash_1";
const ANIM_RANGED_FEMALE_LVL2_SLASH_2 = "ranged_female_lvl2_short_range_slash_2";
const ANIM_RANGED_FEMALE_LVL2_SLASH_3 = "ranged_female_lvl2_short_range_slash_3";
const ANIM_RANGED_FEMALE_LVL3_HURT = "ranged_female_lvl3_long_range_hurt";
const ANIM_RANGED_FEMALE_LVL3_IDLE = "ranged_female_lvl3_long_range_idle";
const ANIM_RANGED_FEMALE_LVL3_IDLE_1 = "ranged_female_lvl3_long_range_idle_1";
const ANIM_RANGED_FEMALE_LVL3_IDLE_2 = "ranged_female_lvl3_long_range_idle_2";
const ANIM_RANGED_FEMALE_LVL3_IDLE_3 = "ranged_female_lvl3_long_range_idle_3";
const ANIM_RANGED_FEMALE_LVL3_SHOOT = "ranged_female_lvl3_long_range_shoot";
const ANIM_RANGED_FEMALE_LVL3_SHOOT_1 = "ranged_female_lvl3_long_range_shoot_1";
const ANIM_RANGED_FEMALE_LVL3_SHOOT_2 = "ranged_female_lvl3_long_range_shoot_2";
const ANIM_RANGED_FEMALE_LVL3_SHOOT_3 = "ranged_female_lvl3_long_range_shoot_3";
const ANIM_RANGED_FEMALE_LVL3_WALK = "ranged_female_lvl3_long_range_walk";
const ANIM_RANGED_FEMALE_LVL3_WALK_1 = "ranged_female_lvl3_long_range_walk_1";
const ANIM_RANGED_FEMALE_LVL3_WALK_2 = "ranged_female_lvl3_long_range_walk_2";
const ANIM_RANGED_FEMALE_LVL3_WALK_3 = "ranged_female_lvl3_long_range_walk_3";
const ANIM_RANGED_FEMALE_LVL3_SLASH = "ranged_female_lvl3_short_range_slash";
const ANIM_RANGED_FEMALE_LVL3_SLASH_1 = "ranged_female_lvl3_short_range_slash_1";
const ANIM_RANGED_FEMALE_LVL3_SLASH_2 = "ranged_female_lvl3_short_range_slash_2";
const ANIM_RANGED_FEMALE_LVL3_SLASH_3 = "ranged_female_lvl3_short_range_slash_3";

export const ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_1: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_RANGED_FEMALE_LVL1_IDLE },
    south: { key: ANIM_RANGED_FEMALE_LVL1_IDLE_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL1_IDLE_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL1_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_RANGED_FEMALE_LVL1_WALK },
    south: { key: ANIM_RANGED_FEMALE_LVL1_WALK_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL1_WALK_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL1_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_RANGED_FEMALE_LVL1_SLASH },
    south: { key: ANIM_RANGED_FEMALE_LVL1_SLASH_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL1_SLASH_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL1_SLASH_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_RANGED_FEMALE_LVL1_SHOOT },
    south: { key: ANIM_RANGED_FEMALE_LVL1_SHOOT_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL1_SHOOT_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL1_SHOOT_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_RANGED_FEMALE_LVL1_HURT },
    south: { key: ANIM_RANGED_FEMALE_LVL1_HURT },
    west: { key: ANIM_RANGED_FEMALE_LVL1_HURT },
    east: { key: ANIM_RANGED_FEMALE_LVL1_HURT }
  }
};
export const ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_2: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_RANGED_FEMALE_LVL2_IDLE },
    south: { key: ANIM_RANGED_FEMALE_LVL2_IDLE_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL2_IDLE_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL2_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_RANGED_FEMALE_LVL2_WALK },
    south: { key: ANIM_RANGED_FEMALE_LVL2_WALK_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL2_WALK_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL2_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_RANGED_FEMALE_LVL2_SLASH },
    south: { key: ANIM_RANGED_FEMALE_LVL2_SLASH_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL2_SLASH_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL2_SLASH_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_RANGED_FEMALE_LVL2_SHOOT },
    south: { key: ANIM_RANGED_FEMALE_LVL2_SHOOT_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL2_SHOOT_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL2_SHOOT_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_RANGED_FEMALE_LVL2_HURT },
    south: { key: ANIM_RANGED_FEMALE_LVL2_HURT },
    west: { key: ANIM_RANGED_FEMALE_LVL2_HURT },
    east: { key: ANIM_RANGED_FEMALE_LVL2_HURT }
  }
};
export const ANIM_SKADUWEE_RANGED_FEMALE_DEFINITION_LEVEL_3: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_RANGED_FEMALE_LVL3_IDLE },
    south: { key: ANIM_RANGED_FEMALE_LVL3_IDLE_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL3_IDLE_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL3_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_RANGED_FEMALE_LVL3_WALK },
    south: { key: ANIM_RANGED_FEMALE_LVL3_WALK_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL3_WALK_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL3_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_RANGED_FEMALE_LVL3_SLASH },
    south: { key: ANIM_RANGED_FEMALE_LVL3_SLASH_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL3_SLASH_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL3_SLASH_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_RANGED_FEMALE_LVL3_SHOOT },
    south: { key: ANIM_RANGED_FEMALE_LVL3_SHOOT_2 },
    west: { key: ANIM_RANGED_FEMALE_LVL3_SHOOT_1 },
    east: { key: ANIM_RANGED_FEMALE_LVL3_SHOOT_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_RANGED_FEMALE_LVL3_HURT },
    south: { key: ANIM_RANGED_FEMALE_LVL3_HURT },
    west: { key: ANIM_RANGED_FEMALE_LVL3_HURT },
    east: { key: ANIM_RANGED_FEMALE_LVL3_HURT }
  }
};
