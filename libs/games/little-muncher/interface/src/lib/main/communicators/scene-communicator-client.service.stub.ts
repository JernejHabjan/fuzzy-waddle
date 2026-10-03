import type { SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";

export const SceneCommunicatorClientServiceStub = {
  startListeningToEvents(): Promise<void> {
    return Promise.resolve();
  },
  stopListeningToEvents() {
    //
  }
} satisfies SceneCommunicatorClientServiceInterface;
