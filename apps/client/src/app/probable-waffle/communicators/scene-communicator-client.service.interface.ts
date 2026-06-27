import { Subscription } from "rxjs";

import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import type { GameInstanceId } from "@fuzzy-waddle/api-interfaces";

export interface SceneCommunicatorClientServiceInterface {
  createCommunicators(gameInstanceId: GameInstanceId, useServerTransport?: boolean): Promise<ProbableWaffleCommunicators>;
  destroyCommunicators(
    gameInstanceId: GameInstanceId,
    subscriptions: Subscription[],
    useServerTransport?: boolean
  ): Promise<void>;
}
