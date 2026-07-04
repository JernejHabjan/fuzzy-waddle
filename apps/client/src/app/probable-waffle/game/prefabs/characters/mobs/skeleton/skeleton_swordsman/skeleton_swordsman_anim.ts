import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_SKELETON_SWORDSMAN_HURT = "skeleton_swordsman_hurt";
const ANIM_SKELETON_SWORDSMAN_IDLE = "skeleton_swordsman_idle";
const ANIM_SKELETON_SWORDSMAN_IDLE_1 = "skeleton_swordsman_idle_1";
const ANIM_SKELETON_SWORDSMAN_IDLE_2 = "skeleton_swordsman_idle_2";
const ANIM_SKELETON_SWORDSMAN_IDLE_3 = "skeleton_swordsman_idle_3";
const ANIM_SKELETON_SWORDSMAN_SLASH = "skeleton_swordsman_slash";
const ANIM_SKELETON_SWORDSMAN_SLASH_1 = "skeleton_swordsman_slash_1";
const ANIM_SKELETON_SWORDSMAN_SLASH_2 = "skeleton_swordsman_slash_2";
const ANIM_SKELETON_SWORDSMAN_SLASH_3 = "skeleton_swordsman_slash_3";
const ANIM_SKELETON_SWORDSMAN_WALK = "skeleton_swordsman_walk";
const ANIM_SKELETON_SWORDSMAN_WALK_1 = "skeleton_swordsman_walk_1";
const ANIM_SKELETON_SWORDSMAN_WALK_2 = "skeleton_swordsman_walk_2";
const ANIM_SKELETON_SWORDSMAN_WALK_3 = "skeleton_swordsman_walk_3";

export const ANIM_SKELETON_SWORDSMAN_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKELETON_SWORDSMAN_IDLE },
    south: { key: ANIM_SKELETON_SWORDSMAN_IDLE_2 },
    west: { key: ANIM_SKELETON_SWORDSMAN_IDLE_1 },
    east: { key: ANIM_SKELETON_SWORDSMAN_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKELETON_SWORDSMAN_WALK },
    south: { key: ANIM_SKELETON_SWORDSMAN_WALK_2 },
    west: { key: ANIM_SKELETON_SWORDSMAN_WALK_1 },
    east: { key: ANIM_SKELETON_SWORDSMAN_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKELETON_SWORDSMAN_SLASH },
    south: { key: ANIM_SKELETON_SWORDSMAN_SLASH_2 },
    west: { key: ANIM_SKELETON_SWORDSMAN_SLASH_1 },
    east: { key: ANIM_SKELETON_SWORDSMAN_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKELETON_SWORDSMAN_HURT },
    south: { key: ANIM_SKELETON_SWORDSMAN_HURT },
    west: { key: ANIM_SKELETON_SWORDSMAN_HURT },
    east: { key: ANIM_SKELETON_SWORDSMAN_HURT }
  }
};
