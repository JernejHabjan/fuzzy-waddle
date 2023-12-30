export interface SceneCommunicatorClientServiceInterface {
  startListeningToEvents(gameInstanceId: string): void;
  stopListeningToEvents(gameInstanceId: string): void;
}
