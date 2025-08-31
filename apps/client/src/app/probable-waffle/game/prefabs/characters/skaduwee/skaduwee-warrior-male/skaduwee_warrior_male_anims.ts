const ANIM_SKADUWEE_WARRIOR_MALE_HURT = "skaduwee_warrior_male_hurt";
const ANIM_SKADUWEE_WARRIOR_MALE_IDLE_UP = "skaduwee_warrior_male_idle_up";
const ANIM_SKADUWEE_WARRIOR_MALE_IDLE_LEFT = "skaduwee_warrior_male_idle_left";
const ANIM_SKADUWEE_WARRIOR_MALE_IDLE_DOWN = "skaduwee_warrior_male_idle_down";
const ANIM_SKADUWEE_WARRIOR_MALE_IDLE_RIGHT = "skaduwee_warrior_male_idle_right";
const ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_UP = "skaduwee_warrior_male_islash_up";
const ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_LEFT = "skaduwee_warrior_male_islash_left";
const ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_DOWN = "skaduwee_warrior_male_islash_down";
const ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_RIGHT = "skaduwee_warrior_male_islash_right";
const ANIM_SKADUWEE_WARRIOR_MALE_SMASH_UP = "skaduwee_warrior_male_smash_up";
const ANIM_SKADUWEE_WARRIOR_MALE_SMASH_LEFT = "skaduwee_warrior_male_smash_left";
const ANIM_SKADUWEE_WARRIOR_MALE_SMASH_DOWN = "skaduwee_warrior_male_smash_down";
const ANIM_SKADUWEE_WARRIOR_MALE_SMASH_RIGHT = "skaduwee_warrior_male_smash_right";
const ANIM_SKADUWEE_WARRIOR_MALE_SLASH_UP = "skaduwee_warrior_male_slash_up";
const ANIM_SKADUWEE_WARRIOR_MALE_SLASH_LEFT = "skaduwee_warrior_male_slash_left";
const ANIM_SKADUWEE_WARRIOR_MALE_SLASH_DOWN = "skaduwee_warrior_male_slash_down";
const ANIM_SKADUWEE_WARRIOR_MALE_SLASH_RIGHT = "skaduwee_warrior_male_slash_right";
const ANIM_SKADUWEE_WARRIOR_MALE_WALK_UP = "skaduwee_warrior_male_walk_up";
const ANIM_SKADUWEE_WARRIOR_MALE_WALK_LEFT = "skaduwee_warrior_male_walk_left";
const ANIM_SKADUWEE_WARRIOR_MALE_WALK_DOWN = "skaduwee_warrior_male_walk_down";
const ANIM_SKADUWEE_WARRIOR_MALE_WALK_RIGHT = "skaduwee_warrior_male_walk_right";

import {
  type AnimationDefinitionMap,
  AnimationType
} from "../../../../entity/actor/components/animation-actor-component";

export const ANIM_SKADUWEE_WARRIOR_MALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKADUWEE_WARRIOR_MALE_IDLE_UP },
    south: { key: ANIM_SKADUWEE_WARRIOR_MALE_IDLE_DOWN },
    west: { key: ANIM_SKADUWEE_WARRIOR_MALE_IDLE_LEFT },
    east: { key: ANIM_SKADUWEE_WARRIOR_MALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKADUWEE_WARRIOR_MALE_WALK_UP },
    south: { key: ANIM_SKADUWEE_WARRIOR_MALE_WALK_DOWN },
    west: { key: ANIM_SKADUWEE_WARRIOR_MALE_WALK_LEFT },
    east: { key: ANIM_SKADUWEE_WARRIOR_MALE_WALK_RIGHT }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_SKADUWEE_WARRIOR_MALE_SLASH_UP },
    south: { key: ANIM_SKADUWEE_WARRIOR_MALE_SLASH_DOWN },
    west: { key: ANIM_SKADUWEE_WARRIOR_MALE_SLASH_LEFT },
    east: { key: ANIM_SKADUWEE_WARRIOR_MALE_SLASH_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKADUWEE_WARRIOR_MALE_HURT },
    south: { key: ANIM_SKADUWEE_WARRIOR_MALE_HURT },
    west: { key: ANIM_SKADUWEE_WARRIOR_MALE_HURT },
    east: { key: ANIM_SKADUWEE_WARRIOR_MALE_HURT }
  },
  [AnimationType.InvertedSlash]: {
    north: { key: ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_UP },
    south: { key: ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_DOWN },
    west: { key: ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_LEFT },
    east: { key: ANIM_SKADUWEE_WARRIOR_MALE_INVERTED_SLASH_RIGHT }
  },
  [AnimationType.Smash]: {
    north: { key: ANIM_SKADUWEE_WARRIOR_MALE_SMASH_UP },
    south: { key: ANIM_SKADUWEE_WARRIOR_MALE_SMASH_DOWN },
    west: { key: ANIM_SKADUWEE_WARRIOR_MALE_SMASH_LEFT },
    east: { key: ANIM_SKADUWEE_WARRIOR_MALE_SMASH_RIGHT }
  }
};
