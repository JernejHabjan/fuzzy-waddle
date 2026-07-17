import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import type { CurrentUserProfileDto } from "@fuzzy-waddle/platform-identity";
import { environment } from "@fuzzy-waddle/environments/environment";
import { AuthService } from "@fuzzy-waddle/platform-identity/client/auth/auth.service";
import type { ICurrentUserProfileService } from "./current-user-profile.service.interface";

@Injectable({
  providedIn: "root"
})
export class CurrentUserProfileService implements ICurrentUserProfileService {
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private cachedProfile: CurrentUserProfileDto | null = null;
  private cachedForUserId: string | null = null;
  private readonly profileCache = new Map<string, CurrentUserProfileDto | null>();
  // The home shell and header can ask for the same profile during bootstrap.
  // Reuse one in-flight request so we do not add duplicate API work to first render.
  private currentProfileRequest: Promise<CurrentUserProfileDto | null> | null = null;
  private readonly userProfileRequests = new Map<string, Promise<CurrentUserProfileDto | null>>();

  async getUserProfile(userId?: string | null, forceRefresh = false): Promise<CurrentUserProfileDto | null> {
    await this.authService.ensureAuthReady();

    const currentUserId = this.authService.userId;
    if (!currentUserId) {
      this.clearCache();
      return null;
    }

    if (!userId || userId === currentUserId) {
      return this.getCurrentUserProfile(forceRefresh);
    }

    if (!forceRefresh && this.profileCache.has(userId)) {
      return this.profileCache.get(userId) ?? null;
    }

    const url = `${environment.api}api/profile/${userId}`;
    if (!forceRefresh) {
      const pendingRequest = this.userProfileRequests.get(userId);
      if (pendingRequest) {
        return await pendingRequest;
      }
    }

    const request = firstValueFrom(this.httpClient.get<CurrentUserProfileDto | null>(url))
      .then((profile) => {
        this.profileCache.set(userId, profile);
        return profile;
      })
      .finally(() => {
        this.userProfileRequests.delete(userId);
      });

    this.userProfileRequests.set(userId, request);
    return await request;
  }

  async getCurrentUserProfile(forceRefresh = false): Promise<CurrentUserProfileDto | null> {
    await this.authService.ensureAuthReady();

    const currentUserId = this.authService.userId;
    if (!currentUserId) {
      this.clearCache();
      return null;
    }

    if (!forceRefresh && this.cachedProfile && this.cachedForUserId === currentUserId) {
      return this.cachedProfile;
    }

    if (!forceRefresh && this.currentProfileRequest) {
      return await this.currentProfileRequest;
    }

    const url = `${environment.api}api/profile/me`;
    this.currentProfileRequest = firstValueFrom(this.httpClient.get<CurrentUserProfileDto>(url))
      .then((profile) => {
        this.cachedProfile = profile;
        this.cachedForUserId = currentUserId;
        return profile;
      })
      .finally(() => {
        this.currentProfileRequest = null;
      });

    return await this.currentProfileRequest;
  }

  clearCache(): void {
    this.cachedProfile = null;
    this.cachedForUserId = null;
    this.profileCache.clear();
    this.currentProfileRequest = null;
    this.userProfileRequests.clear();
  }
}
