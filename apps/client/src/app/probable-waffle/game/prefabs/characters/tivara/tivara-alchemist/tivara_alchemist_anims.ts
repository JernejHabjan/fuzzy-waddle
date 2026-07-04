import { AnimationType } from "../../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

const ANIM_ALCHEMIST_IDLE_UP = "idle_up";
const ANIM_ALCHEMIST_IDLE_LEFT = "idle_left";
const ANIM_ALCHEMIST_IDLE_DOWN = "idle_down";
const ANIM_ALCHEMIST_IDLE_RIGHT = "idle_right";

export const ANIM_TIVARA_ALCHEMIST_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_ALCHEMIST_IDLE_UP },
    south: { key: ANIM_ALCHEMIST_IDLE_DOWN },
    west: { key: ANIM_ALCHEMIST_IDLE_LEFT },
    east: { key: ANIM_ALCHEMIST_IDLE_RIGHT }
  }
};
