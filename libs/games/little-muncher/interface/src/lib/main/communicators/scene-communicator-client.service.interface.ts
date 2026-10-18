import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";

export interface SceneCommunicatorClientServiceInterface {
  startListeningToEvents(gameInstanceId: GameInstanceId): Promise<void>;

  stopListeningToEvents(): void;
}
