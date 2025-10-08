import { type ProbableWaffleCommunicatorServiceInterface } from "./probable-waffle-communicator.service.interface";

export const probableWaffleCommunicatorServiceStub = {
  startCommunication: () => {},
  stopCommunication: () => {}
} satisfies ProbableWaffleCommunicatorServiceInterface;
