import type { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";

// Directional frames for viking boat:
// ship1.png  - NORTH
// ship15.png - NORTH EAST
// ship13.png - EAST
// ship11.png - SOUTH EAST
// ship9.png  - SOUTH
// ship7.png  - SOUTH WEST
// ship5.png  - WEST
// ship3.png  - NORTH WEST
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
