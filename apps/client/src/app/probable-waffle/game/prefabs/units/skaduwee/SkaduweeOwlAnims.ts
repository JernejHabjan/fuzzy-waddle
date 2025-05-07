// The constants with the animation keys.

import { AnimationDefinitionMap, AnimationType } from "../../../entity/actor/components/animation-actor-component";

const ANIM_SKADUWEE_OWL_IDLE_DOWN = "skaduwee/owl/idle/down";

const ANIM_SKADUWEE_OWL_IDLE_RIGHT = "skaduwee/owl/idle/right";

const ANIM_SKADUWEE_OWL_IDLE_UP = "skaduwee/owl/idle/up";

const ANIM_SKADUWEE_OWL_IDLE_RIGHT_1 = "skaduwee/owl/idle/right_1";

const ANIM_SKADUWEE_OWL_MOVE_DOWN = "skaduwee/owl/move/down";

const ANIM_SKADUWEE_OWL_MOVE_LEFT = "skaduwee/owl/move/left";

const ANIM_SKADUWEE_OWL_MOVE_UP = "skaduwee/owl/move/up";

const ANIM_SKADUWEE_OWL_MOVE_RIGHT = "skaduwee/owl/move/right";

const ANIM_SKADUWEE_OWL_ATTACK_UP = "skaduwee/owl/attack/up";

const ANIM_SKADUWEE_OWL_ATTACK_DOWN = "skaduwee/owl/attack/down";

const ANIM_SKADUWEE_OWL_ATTACK_LEFT = "skaduwee/owl/attack/left";

const ANIM_SKADUWEE_OWL_ATTACK_RIGHT = "skaduwee/owl/attack/right";

const ANIM_SKADUWEE_OWL_DIE_DOWN = "skaduwee/owl/die/down";

export const ANIM_SKADUWEE_OWL_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_SKADUWEE_OWL_IDLE_UP },
    south: { key: ANIM_SKADUWEE_OWL_IDLE_DOWN },
    west: { key: ANIM_SKADUWEE_OWL_IDLE_RIGHT_1 },
    east: { key: ANIM_SKADUWEE_OWL_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_SKADUWEE_OWL_MOVE_UP },
    south: { key: ANIM_SKADUWEE_OWL_MOVE_DOWN },
    west: { key: ANIM_SKADUWEE_OWL_MOVE_LEFT },
    east: { key: ANIM_SKADUWEE_OWL_MOVE_RIGHT }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_SKADUWEE_OWL_ATTACK_UP },
    south: { key: ANIM_SKADUWEE_OWL_ATTACK_DOWN },
    west: { key: ANIM_SKADUWEE_OWL_ATTACK_LEFT },
    east: { key: ANIM_SKADUWEE_OWL_ATTACK_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_SKADUWEE_OWL_DIE_DOWN },
    south: { key: ANIM_SKADUWEE_OWL_DIE_DOWN },
    west: { key: ANIM_SKADUWEE_OWL_DIE_DOWN },
    east: { key: ANIM_SKADUWEE_OWL_DIE_DOWN }
  }
};
