import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

import { AnimationType } from "../../../../entity/components/animation/animation-type";

export const ANIM_COMMON_BOAT_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: "common/boat/common_boat-0.png" },
    northeast: { key: "common/boat/common_boat-6.png" },
    east: { key: "common/boat/common_boat-12.png" },
    southeast: { key: "common/boat/common_boat-18.png" },
    south: { key: "common/boat/common_boat-24.png" },
    southwest: { key: "common/boat/common_boat-30.png" },
    west: { key: "common/boat/common_boat-36.png" },
    northwest: { key: "common/boat/common_boat-42.png" }
  }
};
