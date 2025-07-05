import { ProbableWaffleCommunicators } from "./scene-communicator-client.service";
import { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";

export const SceneCommunicatorClientServiceStub = {
  createCommunicators(gameInstanceId: string): Promise<ProbableWaffleCommunicators> {
    return Promise.resolve({} as ProbableWaffleCommunicators);
  },
  destroyCommunicators(): Promise<void> {
    return Promise.resolve();
  }
} satisfies SceneCommunicatorClientServiceInterface;
