import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, Subscription } from "rxjs";
import { environment } from "@fuzzy-waddle/environments/environment";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import type {
  ProbableWafflePlayerPreferences,
  UpdateProbableWafflePlayerPreferencesDto
} from "@fuzzy-waddle/probable-waffle-protocol";
import { GameOptionsService } from "@fuzzy-waddle/probable-waffle-phaser";
import { GameSettings } from "@fuzzy-waddle/probable-waffle-phaser/core/gameSettings";
import type { ChatMessage } from "@fuzzy-waddle/platform-chat";

@Injectable({
  providedIn: "root"
})
export class OptionsService extends GameOptionsService {
  private static readonly pendingSyncKey = "probable-waffle-game-settings-pending-sync";
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private initialized = false;
  private sessionSubscription?: Subscription;
  private synchronization?: Promise<void>;
  private initialization?: Promise<void>;
  private localChangesPendingSync = localStorage.getItem(OptionsService.pendingSyncKey) === "true";

  /** Hydrates local fallback immediately, then reconciles with the database when authentication is available. */
  override init(): Promise<void> {
    if (this.initialized) return this.initialization ?? Promise.resolve();
    super.init();
    this.initialized = true;
    this.sessionSubscription = this.authService.sessionChanges.subscribe((session) => {
      if (session) void this.synchronize();
    });
    this.initialization = this.synchronize();
    return this.initialization;
  }

  override saveChanges(type: "volume" | "game"): void {
    super.saveChanges(type);
    if (type === "game") {
      this.localChangesPendingSync = true;
      localStorage.setItem(OptionsService.pendingSyncKey, "true");
      void this.synchronize();
    }
  }

  /** Selects filtered presentation without mutating the original transport message. */
  presentChatMessage(message: ChatMessage): ChatMessage {
    return this.gameSettings.profanityFilter && message.filteredText !== undefined
      ? { ...message, text: message.filteredText }
      : { ...message };
  }

  private synchronize(): Promise<void> {
    if (this.synchronization) return this.synchronization;
    this.synchronization = this.loadRemoteOrUploadFallback().finally(() => {
      this.synchronization = undefined;
    });
    return this.synchronization;
  }

  /** Remote data wins only when no local edit is awaiting synchronization. */
  private async loadRemoteOrUploadFallback(): Promise<void> {
    try {
      await this.authService.ensureAuthReady();
      if (!this.authService.isAuthenticated) return;
      if (!this.localChangesPendingSync) {
        const url = `${environment.api}api/probable-waffle/preferences`;
        const remote = await firstValueFrom(this.httpClient.get<ProbableWafflePlayerPreferences | null>(url));
        if (!this.authService.isAuthenticated) return;
        if (!this.localChangesPendingSync && remote) {
          this.applyGameSettings(GameSettings.fromUnknown(remote));
          return;
        }
      }
      await this.persistRemote();
    } catch (error) {
      console.warn("[OptionsService] Preference synchronization failed; keeping local fallback.", error);
    }
  }

  /** Serializes uploads and keeps the durable dirty marker until the latest local snapshot is saved. */
  private async persistRemote(): Promise<void> {
    while (this.authService.isAuthenticated) {
      const preferences = { ...this.gameSettings };
      const snapshot = JSON.stringify(preferences);
      const body = { preferences } satisfies UpdateProbableWafflePlayerPreferencesDto;
      await firstValueFrom(
        this.httpClient.put<ProbableWafflePlayerPreferences>(`${environment.api}api/probable-waffle/preferences`, body)
      );
      if (snapshot === JSON.stringify(this.gameSettings)) {
        this.localChangesPendingSync = false;
        localStorage.removeItem(OptionsService.pendingSyncKey);
        return;
      }
    }
  }
}
