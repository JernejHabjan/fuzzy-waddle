import { type SceneCommunicatorClientServiceInterface } from "./scene-communicator-client.service.interface";
import type { ProbableWaffleCommunicators } from "./probable-waffle.communicators";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";

export const SceneCommunicatorClientServiceStub = {
  communicatorObservables: null,
  createCommunicators(gameInstanceId: GameInstanceId): Promise<ProbableWaffleCommunicators> {
    return Promise.resolve({} as ProbableWaffleCommunicators);
  },
  destroyCommunicators(): Promise<void> {
    return Promise.resolve();
  }
} satisfies SceneCommunicatorClientServiceInterface;
