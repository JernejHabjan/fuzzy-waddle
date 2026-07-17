import type { GameInstanceId } from "@fuzzy-waddle/api-interfaces";

export interface SceneCommunicatorClientServiceInterface {
  startListeningToEvents(gameInstanceId: GameInstanceId): Promise<void>;

  stopListeningToEvents(): void;
}
