export interface ServerHealthServiceInterface {
  get serverAvailable(): boolean;
  get serverUnavailable(): boolean;
  get serverChecking(): boolean;
  checkHealth(): Promise<void>;
}
