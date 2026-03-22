import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_FOREST_WENDIGO_IDLE_NE = "forest_wendigo/idle/ne";
const ANIM_FOREST_WENDIGO_IDLE_NW = "forest_wendigo/idle/nw";
const ANIM_FOREST_WENDIGO_IDLE_SE = "forest_wendigo/idle/se";
const ANIM_FOREST_WENDIGO_IDLE_SW = "forest_wendigo/idle/sw";
const ANIM_FOREST_WENDIGO_RUN_NE = "forest_wendigo/run/ne";
const ANIM_FOREST_WENDIGO_RUN_NW = "forest_wendigo/run/nw";
const ANIM_FOREST_WENDIGO_RUN_SE = "forest_wendigo/run/se";
const ANIM_FOREST_WENDIGO_RUN_SW = "forest_wendigo/run/sw";

export const ANIM_FOREST_WENDIGO_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northeast: { key: ANIM_FOREST_WENDIGO_IDLE_NE },
    northwest: { key: ANIM_FOREST_WENDIGO_IDLE_NW },
    southeast: { key: ANIM_FOREST_WENDIGO_IDLE_SE },
    southwest: { key: ANIM_FOREST_WENDIGO_IDLE_SW }
  },
  [AnimationType.Walk]: {
    northeast: { key: ANIM_FOREST_WENDIGO_RUN_NE },
    northwest: { key: ANIM_FOREST_WENDIGO_RUN_NW },
    southeast: { key: ANIM_FOREST_WENDIGO_RUN_SE },
    southwest: { key: ANIM_FOREST_WENDIGO_RUN_SW }
  }
};
