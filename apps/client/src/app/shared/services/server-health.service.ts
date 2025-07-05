import { computed, inject, Injectable, signal } from "@angular/core";
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

  // Create a signal to track server state
  private serverStateSignal = signal<ServerState>(ServerState.checking);

  // Create computed signals for the different states
  private serverAvailableSignal = computed(() => this.serverStateSignal() === ServerState.available);
  private serverUnavailableSignal = computed(() => this.serverStateSignal() === ServerState.down);
  private serverCheckingSignal = computed(() => this.serverStateSignal() === ServerState.checking);

  private checkHealthPromise: Promise<void> | null = null;

  constructor() {
    // noinspection JSIgnoredPromiseFromCall
    this._checkHealth();
  }

  // Keep getters for interface compatibility
  get serverAvailable(): boolean {
    return this.serverAvailableSignal();
  }

  get serverUnavailable(): boolean {
    return this.serverUnavailableSignal();
  }

  get serverChecking(): boolean {
    return this.serverCheckingSignal();
  }

  async checkHealth(): Promise<void | null> {
    if (this.checkHealthPromise) await this.checkHealthPromise;
  }

  private async _checkHealth() {
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
      this.serverStateSignal.set(ServerState.available);
    } catch (e) {
      console.warn("Server is down", e);
      this.serverStateSignal.set(ServerState.down);
    }
  }
}
