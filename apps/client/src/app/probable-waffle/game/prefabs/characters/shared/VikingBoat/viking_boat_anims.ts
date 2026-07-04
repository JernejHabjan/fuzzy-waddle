import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

import { AnimationType } from "../../../../entity/components/animation/animation-type";

export const ANIM_VIKING_BOAT_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: "common/viking-ship/ship1.png" },
    northwest: { key: "common/viking-ship/ship3.png" },
    west: { key: "common/viking-ship/ship5.png" },
    southwest: { key: "common/viking-ship/ship7.png" },
    south: { key: "common/viking-ship/ship9.png" },
    southeast: { key: "common/viking-ship/ship11.png" },
    east: { key: "common/viking-ship/ship13.png" },
    northeast: { key: "common/viking-ship/ship15.png" }
  }
};
