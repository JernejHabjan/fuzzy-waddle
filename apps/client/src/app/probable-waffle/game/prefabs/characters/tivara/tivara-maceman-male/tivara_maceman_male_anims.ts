import { type AnimationDefinitionMap } from "../../../../entity/actor/components/animation-actor-component";
import { AnimationType } from "../../../../entity/actor/components/animation/animation-type";
const ANIM_TIVARA_MACEMAN_MALE_HURT = "tivara_maceman_male_hurt";
const ANIM_TIVARA_MACEMAN_MALE_IDLE_UP = "tivara_maceman_male_idle_up";
const ANIM_TIVARA_MACEMAN_MALE_IDLE_LEFT = "tivara_maceman_male_idle_left";
const ANIM_TIVARA_MACEMAN_MALE_IDLE_DOWN = "tivara_maceman_male_idle_down";
const ANIM_TIVARA_MACEMAN_MALE_IDLE_RIGHT = "tivara_maceman_male_idle_right";
const ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_UP = "tivara_maceman_male_islash_up";
const ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_LEFT = "tivara_maceman_male_islash_left";
const ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_DOWN = "tivara_maceman_male_islash_down";
const ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_RIGHT = "tivara_maceman_male_islash_right";
const ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_UP = "tivara_maceman_male_large_slash_up";
const ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_LEFT = "tivara_maceman_male_large_slash_left";
const ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_DOWN = "tivara_maceman_male_large_slash_down";
const ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_RIGHT = "tivara_maceman_male_large_slash_right";
const ANIM_TIVARA_MACEMAN_MALE_WALK_UP = "tivara_maceman_male_walk_up";
const ANIM_TIVARA_MACEMAN_MALE_WALK_LEFT = "tivara_maceman_male_walk_left";
const ANIM_TIVARA_MACEMAN_MALE_WALK_DOWN = "tivara_maceman_male_walk_down";
const ANIM_TIVARA_MACEMAN_MALE_WALK_RIGHT = "tivara_maceman_male_walk_right";

export const ANIM_TIVARA_MACEMAN_MALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_TIVARA_MACEMAN_MALE_IDLE_UP },
    south: { key: ANIM_TIVARA_MACEMAN_MALE_IDLE_DOWN },
    west: { key: ANIM_TIVARA_MACEMAN_MALE_IDLE_LEFT },
    east: { key: ANIM_TIVARA_MACEMAN_MALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_TIVARA_MACEMAN_MALE_WALK_UP },
    south: { key: ANIM_TIVARA_MACEMAN_MALE_WALK_DOWN },
    west: { key: ANIM_TIVARA_MACEMAN_MALE_WALK_LEFT },
    east: { key: ANIM_TIVARA_MACEMAN_MALE_WALK_RIGHT }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_UP },
    south: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_DOWN },
    west: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_LEFT },
    east: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_RIGHT }
  },
  [AnimationType.InvertedSlash]: {
    north: { key: ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_UP },
    south: { key: ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_DOWN },
    west: { key: ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_LEFT },
    east: { key: ANIM_TIVARA_MACEMAN_MALE_INVERTED_SLASH_RIGHT }
  },
  [AnimationType.LargeSlash]: {
    north: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_UP },
    south: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_DOWN },
    west: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_LEFT },
    east: { key: ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_TIVARA_MACEMAN_MALE_HURT },
    south: { key: ANIM_TIVARA_MACEMAN_MALE_HURT },
    west: { key: ANIM_TIVARA_MACEMAN_MALE_HURT },
    east: { key: ANIM_TIVARA_MACEMAN_MALE_HURT }
  }
};
