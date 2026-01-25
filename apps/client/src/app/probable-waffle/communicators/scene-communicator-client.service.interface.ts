import { Subscription } from "rxjs";

import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import type { GameInstanceId } from "@fuzzy-waddle/api-interfaces";

export interface SceneCommunicatorClientServiceInterface {
  createCommunicators(gameInstanceId: GameInstanceId): Promise<ProbableWaffleCommunicators>;
  destroyCommunicators(gameInstanceId: GameInstanceId, subscriptions: Subscription[]): Promise<void>;
}
