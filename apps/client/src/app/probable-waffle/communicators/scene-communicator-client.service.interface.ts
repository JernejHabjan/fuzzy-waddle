import { Subscription } from "rxjs";
import { ProbableWaffleCommunicators } from "./scene-communicator-client.service";

export interface SceneCommunicatorClientServiceInterface {
  createCommunicators(gameInstanceId: string): Promise<ProbableWaffleCommunicators>;
  destroyCommunicators(gameInstanceId: string, subscriptions: Subscription[]): Promise<void>;
}
