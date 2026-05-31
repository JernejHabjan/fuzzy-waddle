import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import type { CurrentUserProfileDto } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../auth/auth.service";
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
    const profile = await firstValueFrom(this.httpClient.get<CurrentUserProfileDto | null>(url));
    this.profileCache.set(userId, profile);
    return profile;
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

    const url = `${environment.api}api/profile/me`;
    this.cachedProfile = await firstValueFrom(this.httpClient.get<CurrentUserProfileDto>(url));
    this.cachedForUserId = currentUserId;
    return this.cachedProfile;
  }

  clearCache(): void {
    this.cachedProfile = null;
    this.cachedForUserId = null;
    this.profileCache.clear();
  }
}
