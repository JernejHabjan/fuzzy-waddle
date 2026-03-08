import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_SKELETON_BOWMAN_HURT = "skeleton_bowman_hurt";
const ANIM_SKELETON_BOWMAN_IDLE = "skeleton_bowman_idle";
const ANIM_SKELETON_BOWMAN_IDLE_1 = "skeleton_bowman_idle_1";
const ANIM_SKELETON_BOWMAN_IDLE_2 = "skeleton_bowman_idle_2";
const ANIM_SKELETON_BOWMAN_IDLE_3 = "skeleton_bowman_idle_3";
const ANIM_SKELETON_BOWMAN_SHOOT = "skeleton_bowman_shoot";
const ANIM_SKELETON_BOWMAN_SHOOT_1 = "skeleton_bowman_shoot_1";
const ANIM_SKELETON_BOWMAN_SHOOT_2 = "skeleton_bowman_shoot_2";
const ANIM_SKELETON_BOWMAN_SHOOT_3 = "skeleton_bowman_shoot_3";
const ANIM_SKELETON_BOWMAN_SLASH = "skeleton_bowman_slash";
const ANIM_SKELETON_BOWMAN_SLASH_1 = "skeleton_bowman_slash_1";
const ANIM_SKELETON_BOWMAN_SLASH_2 = "skeleton_bowman_slash_2";
const ANIM_SKELETON_BOWMAN_SLASH_3 = "skeleton_bowman_slash_3";
const ANIM_SKELETON_BOWMAN_WALK = "skeleton_bowman_walk";
const ANIM_SKELETON_BOWMAN_WALK_1 = "skeleton_bowman_walk_1";
const ANIM_SKELETON_BOWMAN_WALK_2 = "skeleton_bowman_walk_2";
const ANIM_SKELETON_BOWMAN_WALK_3 = "skeleton_bowman_walk_3";

export const ANIM_SKELETON_BOWMAN_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKELETON_BOWMAN_IDLE },
    south: { key: ANIM_SKELETON_BOWMAN_IDLE_2 },
    west: { key: ANIM_SKELETON_BOWMAN_IDLE_1 },
    east: { key: ANIM_SKELETON_BOWMAN_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKELETON_BOWMAN_WALK },
    south: { key: ANIM_SKELETON_BOWMAN_WALK_2 },
    west: { key: ANIM_SKELETON_BOWMAN_WALK_1 },
    east: { key: ANIM_SKELETON_BOWMAN_WALK_3 }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_SKELETON_BOWMAN_SHOOT },
    south: { key: ANIM_SKELETON_BOWMAN_SHOOT_2 },
    west: { key: ANIM_SKELETON_BOWMAN_SHOOT_1 },
    east: { key: ANIM_SKELETON_BOWMAN_SHOOT_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKELETON_BOWMAN_SLASH },
    south: { key: ANIM_SKELETON_BOWMAN_SLASH_2 },
    west: { key: ANIM_SKELETON_BOWMAN_SLASH_1 },
    east: { key: ANIM_SKELETON_BOWMAN_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKELETON_BOWMAN_HURT },
    south: { key: ANIM_SKELETON_BOWMAN_HURT },
    west: { key: ANIM_SKELETON_BOWMAN_HURT },
    east: { key: ANIM_SKELETON_BOWMAN_HURT }
  }
};
