import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";

export const sceneCommunicatorClientServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
} satisfies SceneCommunicatorClientServiceInterface;
