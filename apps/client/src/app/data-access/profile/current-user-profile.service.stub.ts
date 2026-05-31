import { AppUserRole, type CurrentUserProfileDto, UserAccountStatus } from "@fuzzy-waddle/api-interfaces";
import type { ICurrentUserProfileService } from "./current-user-profile.service.interface";

export const currentUserProfileServiceStub = {
  getCurrentUserProfile(): Promise<CurrentUserProfileDto | null> {
    return Promise.resolve({
      id: "user-id",
      email: "user@example.com",
      displayName: "Test User",
      avatarUrl: null,
      role: AppUserRole.User,
      accountStatus: UserAccountStatus.Active,
      bannedUntil: null,
      moderationNote: null,
      isBanned: false
    });
  },
  clearCache(): void {}
} satisfies ICurrentUserProfileService;
