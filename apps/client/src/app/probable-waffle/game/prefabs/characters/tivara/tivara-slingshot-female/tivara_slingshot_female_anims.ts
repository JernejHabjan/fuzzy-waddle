import { type AnimationDefinitionMap } from "../../../../entity/components/animation/animation-actor-component";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
const ANIM_TIVARA_SLINGSHOT_FEMALE_HURT = "tivara_slingshot_female_hurt";
const ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_UP = "tivara_slingshot_female_idle_up";
const ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_LEFT = "tivara_slingshot_female_idle_left";
const ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_DOWN = "tivara_slingshot_female_idle_down";
const ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_RIGHT = "tivara_slingshot_female_idle_right";
const ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_UP = "tivara_slingshot_female_shoot_up";
const ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_LEFT = "tivara_slingshot_female_shoot_left";
const ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_DOWN = "tivara_slingshot_female_shoot_down";
const ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_RIGHT = "tivara_slingshot_female_shoot_right";
const ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_UP = "tivara_slingshot_female_walk_up";
const ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_LEFT = "tivara_slingshot_female_walk_left";
const ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_DOWN = "tivara_slingshot_female_walk_down";
const ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_RIGHT = "tivara_slingshot_female_walk_right";

export const ANIM_TIVARA_SLINGSHOT_FEMALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_UP },
    south: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_DOWN },
    west: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_LEFT },
    east: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_UP },
    south: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_DOWN },
    west: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_LEFT },
    east: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_WALK_RIGHT }
  },
  [AnimationType.Shoot]: {
    north: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_UP },
    south: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_DOWN },
    west: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_LEFT },
    east: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_SHOOT_RIGHT }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_HURT },
    south: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_HURT },
    west: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_HURT },
    east: { key: ANIM_TIVARA_SLINGSHOT_FEMALE_HURT }
  }
};
