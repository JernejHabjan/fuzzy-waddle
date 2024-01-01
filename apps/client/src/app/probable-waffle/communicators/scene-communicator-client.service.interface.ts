export interface SceneCommunicatorClientServiceInterface {
  createCommunicators(gameInstanceId: string): void;
  destroyCommunicators(gameInstanceId: string): void;
}
