export interface SceneCommunicatorClientServiceInterface {
  startListeningToEvents(gameInstanceId: string): void;

  stopListeningToEvents(): void;
}
