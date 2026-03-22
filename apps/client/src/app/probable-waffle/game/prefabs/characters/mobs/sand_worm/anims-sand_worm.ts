import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_SAND_WORM_IDLE_NE = "sand_worm/idle/ne";
const ANIM_SAND_WORM_IDLE_NW = "sand_worm/idle/nw";
const ANIM_SAND_WORM_IDLE_SE = "sand_worm/idle/se";
const ANIM_SAND_WORM_IDLE_SW = "sand_worm/idle/sw";
const ANIM_SAND_WORM_RUN_NE = "sand_worm/run/ne";
const ANIM_SAND_WORM_RUN_NW = "sand_worm/run/nw";
const ANIM_SAND_WORM_RUN_SE = "sand_worm/run/se";
const ANIM_SAND_WORM_RUN_SW = "sand_worm/run/sw";

export const ANIM_SAND_WORM_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_SAND_WORM_IDLE_NE },
    northwest: { key: ANIM_SAND_WORM_IDLE_NW },
    southeast: { key: ANIM_SAND_WORM_IDLE_SE },
    southwest: { key: ANIM_SAND_WORM_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_SAND_WORM_RUN_NE },
    northwest: { key: ANIM_SAND_WORM_RUN_NW },
    southeast: { key: ANIM_SAND_WORM_RUN_SE },
    southwest: { key: ANIM_SAND_WORM_RUN_SW }
  }
};
