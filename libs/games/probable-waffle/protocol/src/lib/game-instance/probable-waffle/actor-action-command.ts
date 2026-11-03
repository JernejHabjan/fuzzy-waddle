import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { OrderType } from "../../probable-waffle/order-type";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface ActorActionCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.ActorAction;
  readonly orderType?: OrderType;
  readonly targetObjectIds?: readonly ActorId[];
  readonly tileVec3?: Vector3Simple;
  readonly queue: boolean;
}
