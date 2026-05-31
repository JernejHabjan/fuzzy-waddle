import { inject, Injectable } from "@angular/core";
import { type CanActivate, Router } from "@angular/router";
import { AppUserRole } from "@fuzzy-waddle/api-interfaces";
import { CurrentUserProfileService } from "../data-access/profile/current-user-profile.service";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root"
})
export class AppRoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly currentUserProfileService = inject(CurrentUserProfileService);
  private readonly router = inject(Router);

  async canActivate(): Promise<boolean> {
    await this.authService.ensureAuthReady();

    if (!this.authService.isAuthenticated) {
      await this.router.navigate(["/"]);
      return false;
    }

    try {
      const profile = await this.currentUserProfileService.getCurrentUserProfile();
      if (
        profile &&
        !profile.isBanned &&
        (profile.role === AppUserRole.Moderator || profile.role === AppUserRole.Admin)
      ) {
        return true;
      }
    } catch {
      // Route should stay closed if role lookup fails.
    }

    await this.router.navigate(["/"]);
    return false;
  }
}
