import { ServerHealthServiceInterface } from "./server-health.service.interface";

export const serverHealthServiceStub = {
  checkHealth(): Promise<void> {
    return Promise.resolve();
  },
  get serverAvailable(): boolean {
    return true;
  },
  get serverChecking(): boolean {
    return false;
  },
  get serverUnavailable(): boolean {
    return false;
  }
} satisfies ServerHealthServiceInterface;
