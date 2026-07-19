import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AppUserRole } from "@fuzzy-waddle/platform-database-schema";
import { CurrentUserProfileService } from "../profile-data/current-user-profile.service";
import { AuthService } from "./auth.service";
import { AppRoleGuard } from "./app-role.guard";

describe("AppRoleGuard", () => {
  const authService = {
    isAuthenticated: true,
    ensureAuthReady: jest.fn().mockResolvedValue(null)
  };
  const currentUserProfileService = {
    getCurrentUserProfile: jest.fn()
  };
  const router = { navigate: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated = true;
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: CurrentUserProfileService, useValue: currentUserProfileService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it("allows an active moderator", async () => {
    currentUserProfileService.getCurrentUserProfile.mockResolvedValue({
      role: AppUserRole.Moderator,
      isBanned: false
    });

    await expect(TestBed.inject(AppRoleGuard).canActivate()).resolves.toBe(true);
  });

  it("redirects a regular user", async () => {
    currentUserProfileService.getCurrentUserProfile.mockResolvedValue({
      role: AppUserRole.User,
      isBanned: false
    });

    await expect(TestBed.inject(AppRoleGuard).canActivate()).resolves.toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(["/"]);
  });
});
