import { AnimationType } from "../../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

const ANIM_WARRIOR_MALE_LVL1_HURT = "warrior_male_lvl1_hurt";
const ANIM_WARRIOR_MALE_LVL1_IDLE = "warrior_male_lvl1_idle";
const ANIM_WARRIOR_MALE_LVL1_IDLE_1 = "warrior_male_lvl1_idle_1";
const ANIM_WARRIOR_MALE_LVL1_IDLE_2 = "warrior_male_lvl1_idle_2";
const ANIM_WARRIOR_MALE_LVL1_IDLE_3 = "warrior_male_lvl1_idle_3";
const ANIM_WARRIOR_MALE_LVL1_ISLASH = "warrior_male_lvl1_islash";
const ANIM_WARRIOR_MALE_LVL1_ISLASH_1 = "warrior_male_lvl1_islash_1";
const ANIM_WARRIOR_MALE_LVL1_ISLASH_2 = "warrior_male_lvl1_islash_2";
const ANIM_WARRIOR_MALE_LVL1_ISLASH_3 = "warrior_male_lvl1_islash_3";
const ANIM_WARRIOR_MALE_LVL1_SLASH = "warrior_male_lvl1_slash";
const ANIM_WARRIOR_MALE_LVL1_SLASH_1 = "warrior_male_lvl1_slash_1";
const ANIM_WARRIOR_MALE_LVL1_SLASH_2 = "warrior_male_lvl1_slash_2";
const ANIM_WARRIOR_MALE_LVL1_SLASH_3 = "warrior_male_lvl1_slash_3";
const ANIM_WARRIOR_MALE_LVL1_SMASH = "warrior_male_lvl1_smash";
const ANIM_WARRIOR_MALE_LVL1_SMASH_1 = "warrior_male_lvl1_smash_1";
const ANIM_WARRIOR_MALE_LVL1_SMASH_2 = "warrior_male_lvl1_smash_2";
const ANIM_WARRIOR_MALE_LVL1_SMASH_3 = "warrior_male_lvl1_smash_3";
const ANIM_WARRIOR_MALE_LVL1_WALK = "warrior_male_lvl1_walk";
const ANIM_WARRIOR_MALE_LVL1_WALK_1 = "warrior_male_lvl1_walk_1";
const ANIM_WARRIOR_MALE_LVL1_WALK_2 = "warrior_male_lvl1_walk_2";
const ANIM_WARRIOR_MALE_LVL1_WALK_3 = "warrior_male_lvl1_walk_3";
const ANIM_WARRIOR_MALE_LVL2_HURT = "warrior_male_lvl2_hurt";
const ANIM_WARRIOR_MALE_LVL2_IDLE = "warrior_male_lvl2_idle";
const ANIM_WARRIOR_MALE_LVL2_IDLE_1 = "warrior_male_lvl2_idle_1";
const ANIM_WARRIOR_MALE_LVL2_IDLE_2 = "warrior_male_lvl2_idle_2";
const ANIM_WARRIOR_MALE_LVL2_IDLE_3 = "warrior_male_lvl2_idle_3";
const ANIM_WARRIOR_MALE_LVL2_ISLASH = "warrior_male_lvl2_islash";
const ANIM_WARRIOR_MALE_LVL2_ISLASH_1 = "warrior_male_lvl2_islash_1";
const ANIM_WARRIOR_MALE_LVL2_ISLASH_2 = "warrior_male_lvl2_islash_2";
const ANIM_WARRIOR_MALE_LVL2_ISLASH_3 = "warrior_male_lvl2_islash_3";
const ANIM_WARRIOR_MALE_LVL2_SLASH = "warrior_male_lvl2_slash";
const ANIM_WARRIOR_MALE_LVL2_SLASH_1 = "warrior_male_lvl2_slash_1";
const ANIM_WARRIOR_MALE_LVL2_SLASH_2 = "warrior_male_lvl2_slash_2";
const ANIM_WARRIOR_MALE_LVL2_SLASH_3 = "warrior_male_lvl2_slash_3";
const ANIM_WARRIOR_MALE_LVL2_WALK = "warrior_male_lvl2_walk";
const ANIM_WARRIOR_MALE_LVL2_WALK_1 = "warrior_male_lvl2_walk_1";
const ANIM_WARRIOR_MALE_LVL2_WALK_2 = "warrior_male_lvl2_walk_2";
const ANIM_WARRIOR_MALE_LVL2_WALK_3 = "warrior_male_lvl2_walk_3";
const ANIM_WARRIOR_MALE_LVL3_HURT = "warrior_male_lvl3_hurt";
const ANIM_WARRIOR_MALE_LVL3_IDLE = "warrior_male_lvl3_idle";
const ANIM_WARRIOR_MALE_LVL3_IDLE_1 = "warrior_male_lvl3_idle_1";
const ANIM_WARRIOR_MALE_LVL3_IDLE_2 = "warrior_male_lvl3_idle_2";
const ANIM_WARRIOR_MALE_LVL3_IDLE_3 = "warrior_male_lvl3_idle_3";
const ANIM_WARRIOR_MALE_LVL3_SLASH = "warrior_male_lvl3_slash";
const ANIM_WARRIOR_MALE_LVL3_SLASH_1 = "warrior_male_lvl3_slash_1";
const ANIM_WARRIOR_MALE_LVL3_SLASH_2 = "warrior_male_lvl3_slash_2";
const ANIM_WARRIOR_MALE_LVL3_SLASH_3 = "warrior_male_lvl3_slash_3";
const ANIM_WARRIOR_MALE_LVL3_WALK = "warrior_male_lvl3_walk";
const ANIM_WARRIOR_MALE_LVL3_WALK_1 = "warrior_male_lvl3_walk_1";
const ANIM_WARRIOR_MALE_LVL3_WALK_2 = "warrior_male_lvl3_walk_2";
const ANIM_WARRIOR_MALE_LVL3_WALK_3 = "warrior_male_lvl3_walk_3";

export const ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION_LEVEL_1: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_WARRIOR_MALE_LVL1_IDLE },
    south: { key: ANIM_WARRIOR_MALE_LVL1_IDLE_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL1_IDLE_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL1_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_WARRIOR_MALE_LVL1_WALK },
    south: { key: ANIM_WARRIOR_MALE_LVL1_WALK_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL1_WALK_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL1_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_WARRIOR_MALE_LVL1_SLASH },
    south: { key: ANIM_WARRIOR_MALE_LVL1_SLASH_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL1_SLASH_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL1_SLASH_3 }
  },
  [AnimationType.InvertedSlash]: {
    north: { key: ANIM_WARRIOR_MALE_LVL1_ISLASH },
    south: { key: ANIM_WARRIOR_MALE_LVL1_ISLASH_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL1_ISLASH_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL1_ISLASH_3 }
  },
  [AnimationType.Smash]: {
    north: { key: ANIM_WARRIOR_MALE_LVL1_SMASH },
    south: { key: ANIM_WARRIOR_MALE_LVL1_SMASH_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL1_SMASH_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL1_SMASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_WARRIOR_MALE_LVL1_HURT },
    south: { key: ANIM_WARRIOR_MALE_LVL1_HURT },
    west: { key: ANIM_WARRIOR_MALE_LVL1_HURT },
    east: { key: ANIM_WARRIOR_MALE_LVL1_HURT }
  }
};
export const ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION_LEVEL_2: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_WARRIOR_MALE_LVL2_IDLE },
    south: { key: ANIM_WARRIOR_MALE_LVL2_IDLE_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL2_IDLE_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL2_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_WARRIOR_MALE_LVL2_WALK },
    south: { key: ANIM_WARRIOR_MALE_LVL2_WALK_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL2_WALK_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL2_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_WARRIOR_MALE_LVL2_SLASH },
    south: { key: ANIM_WARRIOR_MALE_LVL2_SLASH_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL2_SLASH_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL2_SLASH_3 }
  },
  [AnimationType.InvertedSlash]: {
    north: { key: ANIM_WARRIOR_MALE_LVL2_ISLASH },
    south: { key: ANIM_WARRIOR_MALE_LVL2_ISLASH_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL2_ISLASH_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL2_ISLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_WARRIOR_MALE_LVL2_HURT },
    south: { key: ANIM_WARRIOR_MALE_LVL2_HURT },
    west: { key: ANIM_WARRIOR_MALE_LVL2_HURT },
    east: { key: ANIM_WARRIOR_MALE_LVL2_HURT }
  }
};
export const ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION_LEVEL_3: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_WARRIOR_MALE_LVL3_IDLE },
    south: { key: ANIM_WARRIOR_MALE_LVL3_IDLE_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL3_IDLE_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL3_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_WARRIOR_MALE_LVL3_WALK },
    south: { key: ANIM_WARRIOR_MALE_LVL3_WALK_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL3_WALK_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL3_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_WARRIOR_MALE_LVL3_SLASH },
    south: { key: ANIM_WARRIOR_MALE_LVL3_SLASH_2 },
    west: { key: ANIM_WARRIOR_MALE_LVL3_SLASH_1 },
    east: { key: ANIM_WARRIOR_MALE_LVL3_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_WARRIOR_MALE_LVL3_HURT },
    south: { key: ANIM_WARRIOR_MALE_LVL3_HURT },
    west: { key: ANIM_WARRIOR_MALE_LVL3_HURT },
    east: { key: ANIM_WARRIOR_MALE_LVL3_HURT }
  }
};
