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
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private initialized = false;
  private sessionSubscription?: Subscription;
  private synchronization?: Promise<void>;
  private initialization?: Promise<void>;
  private localChangesPendingSync = false;

  /** Hydrates local fallback immediately, then reconciles with the database when authentication is available. */
  override init(): Promise<void> {
    super.init();
    if (this.initialized) return this.initialization ?? Promise.resolve();
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
      void this.persistRemote();
    }
  }

  /** Selects filtered presentation without mutating the original transport message. */
  presentChatMessage(message: ChatMessage): ChatMessage {
    return this.gameSettings.profanityFilter && message.filteredText
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

  /** Remote data wins after sign-in; a missing document is initialized from the local fallback. */
  private async loadRemoteOrUploadFallback(): Promise<void> {
    await this.authService.ensureAuthReady();
    if (!this.authService.isAuthenticated) return;
    try {
      if (this.localChangesPendingSync) {
        await this.persistRemote();
        return;
      }
      const url = `${environment.api}api/probable-waffle/preferences`;
      const remote = await firstValueFrom(this.httpClient.get<ProbableWafflePlayerPreferences | null>(url));
      if (remote) {
        this.applyGameSettings(GameSettings.fromUnknown(remote));
      } else {
        await this.persistRemote();
      }
    } catch (error) {
      console.warn("[OptionsService] Preference synchronization failed; keeping local fallback.", error);
    }
  }

  private async persistRemote(): Promise<void> {
    if (!this.authService.isAuthenticated) return;
    const body = { preferences: { ...this.gameSettings } } satisfies UpdateProbableWafflePlayerPreferencesDto;
    try {
      await firstValueFrom(
        this.httpClient.put<ProbableWafflePlayerPreferences>(`${environment.api}api/probable-waffle/preferences`, body)
      );
      this.localChangesPendingSync = false;
    } catch (error) {
      // Local storage remains the retry source; the next authenticated initialization reconciles it.
      console.warn("[OptionsService] Preference upload failed; retaining local fallback.", error);
    }
  }
}
