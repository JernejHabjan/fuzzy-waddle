import { Subscription } from "rxjs";

import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";

export interface SceneCommunicatorClientServiceInterface {
  createCommunicators(gameInstanceId: string): Promise<ProbableWaffleCommunicators>;
  destroyCommunicators(gameInstanceId: string, subscriptions: Subscription[]): Promise<void>;
}
