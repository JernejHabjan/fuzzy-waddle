import { type AuthUser } from "@supabase/supabase-js";
import { AppUserRole, type BanUserDto, type CurrentUserProfileDto, UserAccountStatus } from "@fuzzy-waddle/api-interfaces";
import { type UserProfilesServiceInterface } from "./user-profiles.service.interface";

export const userProfilesServiceStub = {
  getCurrentUserProfile(user: AuthUser): Promise<CurrentUserProfileDto> {
    return Promise.resolve({
      id: user.id,
      email: user.email ?? null,
      displayName: "Test User",
      username: null,
      avatarUrl: null,
      bio: null,
      locale: null,
      timezone: null,
      websiteUrl: null,
      role: AppUserRole.User,
      accountStatus: UserAccountStatus.Active,
      bannedUntil: null,
      moderationNote: null,
      isBanned: false,
      createdAt: user.created_at ?? null,
      updatedAt: null,
      playSummary: {
        totalSessions: 0,
        completedSessions: 0,
        wins: 0,
        scoreSubmissions: 0,
        achievementsUnlocked: 0,
        preferredGame: null,
        lastPlayedAt: null,
        gameStats: []
      }
    });
  },
  getUserProfile(user: AuthUser, targetUserId: string): Promise<CurrentUserProfileDto | null> {
    return this.getCurrentUserProfile({ ...user, id: targetUserId });
  },
  ensureOnlineAccess(userId: string): Promise<void> {
    return Promise.resolve();
  },
  ensureModerator(userId: string): Promise<typeof AppUserRole.Moderator> {
    return Promise.resolve(AppUserRole.Moderator);
  },
  banUser(targetUserId: string, actorUserId: string, body: BanUserDto): Promise<void> {
    return Promise.resolve();
  },
  unbanUser(targetUserId: string, actorUserId: string): Promise<void> {
    return Promise.resolve();
  }
} satisfies UserProfilesServiceInterface;
