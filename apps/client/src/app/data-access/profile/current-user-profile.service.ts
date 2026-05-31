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

  async getCurrentUserProfile(forceRefresh = false): Promise<CurrentUserProfileDto | null> {
    if (this.authService.processing) {
      await this.authService.processing;
    } else if (!this.authService.isAuthenticated) {
      await this.authService.autoSignIn();
    }

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
  }
}
