import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

// Directional frames for common boat:
// common_boat-0.png  - NORTH
// common_boat-6.png  - NORTH EAST
// common_boat-12.png - EAST
// common_boat-18.png - SOUTH EAST
// common_boat-24.png - SOUTH
// common_boat-30.png - SOUTH WEST
// common_boat-36.png - WEST
// common_boat-42.png - NORTH WEST
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
