import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export enum ServerState {
  available = 0,
  down = 1,
  checking = 2
}

@Injectable({
  providedIn: 'root'
})
export class ServerHealthService {
  serverState: ServerState = ServerState.checking;

  get serverAvailable(): boolean {
    return this.serverState === ServerState.available;
  }

  get serverUnavailable(): boolean {
    return this.serverState === ServerState.down;
  }

  get serverChecking(): boolean {
    return this.serverState === ServerState.checking;
  }

  constructor(private readonly httpClient: HttpClient) {}
  async checkHealth() {
    const url = environment.api + 'api/health';
    try {
      await firstValueFrom(this.httpClient.get(url, { responseType: 'text' }));
      this.serverState = ServerState.available;
    } catch (e) {
      console.warn('Server is down', e);
      this.serverState = ServerState.down;
    }
  }
}
