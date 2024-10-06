export interface SceneCommunicatorClientServiceInterface {
  startListeningToEvents(gameInstanceId: string): Promise<void>;

  stopListeningToEvents(): void;
}
