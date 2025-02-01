import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { firstValueFrom, timeout } from "rxjs";
import { ServerHealthServiceInterface } from "./server-health.service.interface";

export enum ServerState {
  available = 0,
  down = 1,
  checking = 2
}

@Injectable({
  providedIn: "root"
})
export class ServerHealthService implements ServerHealthServiceInterface {
  private readonly httpClient = inject(HttpClient);

  private serverState: ServerState = ServerState.checking;
  private checkHealthPromise: Promise<void> | null = null;

  get serverAvailable(): boolean {
    return this.serverState === ServerState.available;
  }

  get serverUnavailable(): boolean {
    return this.serverState === ServerState.down;
  }

  get serverChecking(): boolean {
    return this.serverState === ServerState.checking;
  }

  async checkHealth() {
    if (!this.checkHealthPromise) {
      const url = environment.api + "api/health";
      this.checkHealthPromise = this.runCheck(url);
      await this.checkHealthPromise;
      this.checkHealthPromise = null;
    }
    return this.checkHealthPromise;
  }

  private async runCheck(url: string) {
    try {
      await firstValueFrom(this.httpClient.get(url, { responseType: "text" }).pipe(timeout(5000)));
      this.serverState = ServerState.available;
    } catch (e) {
      console.warn("Server is down", e);
      this.serverState = ServerState.down;
    }
  }
}
