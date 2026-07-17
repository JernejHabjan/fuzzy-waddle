import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";

export const SceneCommunicatorClientServiceStub = {
  createCommunicators(gameInstanceId: GameInstanceId): Promise<ProbableWaffleCommunicators> {
    return Promise.resolve({} as ProbableWaffleCommunicators);
  },
  destroyCommunicators(): Promise<void> {
    return Promise.resolve();
  }
} satisfies SceneCommunicatorClientServiceInterface;
