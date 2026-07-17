import { type AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";

const ANIM_PIRATE_SWORDSMAN_HURT = "pirate_swordsman_hurt";
const ANIM_PIRATE_SWORDSMAN_IDLE = "pirate_swordsman_idle";
const ANIM_PIRATE_SWORDSMAN_IDLE_1 = "pirate_swordsman_idle_1";
const ANIM_PIRATE_SWORDSMAN_IDLE_2 = "pirate_swordsman_idle_2";
const ANIM_PIRATE_SWORDSMAN_IDLE_3 = "pirate_swordsman_idle_3";
const ANIM_PIRATE_SWORDSMAN_SLASH = "pirate_swordsman_slash";
const ANIM_PIRATE_SWORDSMAN_SLASH_1 = "pirate_swordsman_slash_1";
const ANIM_PIRATE_SWORDSMAN_SLASH_2 = "pirate_swordsman_slash_2";
const ANIM_PIRATE_SWORDSMAN_SLASH_3 = "pirate_swordsman_slash_3";
const ANIM_PIRATE_SWORDSMAN_WALK = "pirate_swordsman_walk";
const ANIM_PIRATE_SWORDSMAN_WALK_1 = "pirate_swordsman_walk_1";
const ANIM_PIRATE_SWORDSMAN_WALK_2 = "pirate_swordsman_walk_2";
const ANIM_PIRATE_SWORDSMAN_WALK_3 = "pirate_swordsman_walk_3";

export const ANIM_PIRATE_SWORDSMAN_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_PIRATE_SWORDSMAN_IDLE },
    south: { key: ANIM_PIRATE_SWORDSMAN_IDLE_2 },
    west: { key: ANIM_PIRATE_SWORDSMAN_IDLE_1 },
    east: { key: ANIM_PIRATE_SWORDSMAN_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_PIRATE_SWORDSMAN_WALK },
    south: { key: ANIM_PIRATE_SWORDSMAN_WALK_2 },
    west: { key: ANIM_PIRATE_SWORDSMAN_WALK_1 },
    east: { key: ANIM_PIRATE_SWORDSMAN_WALK_3 }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_PIRATE_SWORDSMAN_SLASH },
    south: { key: ANIM_PIRATE_SWORDSMAN_SLASH_2 },
    west: { key: ANIM_PIRATE_SWORDSMAN_SLASH_1 },
    east: { key: ANIM_PIRATE_SWORDSMAN_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_PIRATE_SWORDSMAN_HURT },
    south: { key: ANIM_PIRATE_SWORDSMAN_HURT },
    west: { key: ANIM_PIRATE_SWORDSMAN_HURT },
    east: { key: ANIM_PIRATE_SWORDSMAN_HURT }
  }
};
