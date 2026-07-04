import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_SKELETON_HURT = "skeleton_hurt";
const ANIM_SKELETON_IDLE = "skeleton_idle";
const ANIM_SKELETON_IDLE_1 = "skeleton_idle_1";
const ANIM_SKELETON_IDLE_2 = "skeleton_idle_2";
const ANIM_SKELETON_IDLE_3 = "skeleton_idle_3";
const ANIM_SKELETON_SLASH = "skeleton_slash";
const ANIM_SKELETON_SLASH_1 = "skeleton_slash_1";
const ANIM_SKELETON_SLASH_2 = "skeleton_slash_2";
const ANIM_SKELETON_SLASH_3 = "skeleton_slash_3";
const ANIM_SKELETON_WALK = "skeleton_walk";
const ANIM_SKELETON_WALK_1 = "skeleton_walk_1";
const ANIM_SKELETON_WALK_2 = "skeleton_walk_2";
const ANIM_SKELETON_WALK_3 = "skeleton_walk_3";

export const ANIM_SKELETON_MELEE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKELETON_IDLE },
    south: { key: ANIM_SKELETON_IDLE_2 },
    west: { key: ANIM_SKELETON_IDLE_1 },
    east: { key: ANIM_SKELETON_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKELETON_WALK },
    south: { key: ANIM_SKELETON_WALK_2 },
    west: { key: ANIM_SKELETON_WALK_1 },
    east: { key: ANIM_SKELETON_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKELETON_SLASH },
    south: { key: ANIM_SKELETON_SLASH_2 },
    west: { key: ANIM_SKELETON_SLASH_1 },
    east: { key: ANIM_SKELETON_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKELETON_HURT },
    south: { key: ANIM_SKELETON_HURT },
    west: { key: ANIM_SKELETON_HURT },
    east: { key: ANIM_SKELETON_HURT }
  }
};
