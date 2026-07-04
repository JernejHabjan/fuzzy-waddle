import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_SKELETON_SCYTHE_HURT = "skeleton_scythe_hurt";
const ANIM_SKELETON_SCYTHE_IDLE = "skeleton_scythe_idle";
const ANIM_SKELETON_SCYTHE_IDLE_1 = "skeleton_scythe_idle_1";
const ANIM_SKELETON_SCYTHE_IDLE_2 = "skeleton_scythe_idle_2";
const ANIM_SKELETON_SCYTHE_IDLE_3 = "skeleton_scythe_idle_3";
const ANIM_SKELETON_SCYTHE_SLASH = "skeleton_scythe_slash";
const ANIM_SKELETON_SCYTHE_SLASH_1 = "skeleton_scythe_slash_1";
const ANIM_SKELETON_SCYTHE_SLASH_2 = "skeleton_scythe_slash_2";
const ANIM_SKELETON_SCYTHE_SLASH_3 = "skeleton_scythe_slash_3";
const ANIM_SKELETON_SCYTHE_WALK = "skeleton_scythe_walk";
const ANIM_SKELETON_SCYTHE_WALK_1 = "skeleton_scythe_walk_1";
const ANIM_SKELETON_SCYTHE_WALK_2 = "skeleton_scythe_walk_2";
const ANIM_SKELETON_SCYTHE_WALK_3 = "skeleton_scythe_walk_3";

export const ANIM_SKELETON_SCYTHE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKELETON_SCYTHE_IDLE },
    south: { key: ANIM_SKELETON_SCYTHE_IDLE_2 },
    west: { key: ANIM_SKELETON_SCYTHE_IDLE_1 },
    east: { key: ANIM_SKELETON_SCYTHE_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKELETON_SCYTHE_WALK },
    south: { key: ANIM_SKELETON_SCYTHE_WALK_2 },
    west: { key: ANIM_SKELETON_SCYTHE_WALK_1 },
    east: { key: ANIM_SKELETON_SCYTHE_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKELETON_SCYTHE_SLASH },
    south: { key: ANIM_SKELETON_SCYTHE_SLASH_2 },
    west: { key: ANIM_SKELETON_SCYTHE_SLASH_1 },
    east: { key: ANIM_SKELETON_SCYTHE_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKELETON_SCYTHE_HURT },
    south: { key: ANIM_SKELETON_SCYTHE_HURT },
    west: { key: ANIM_SKELETON_SCYTHE_HURT },
    east: { key: ANIM_SKELETON_SCYTHE_HURT }
  }
};
