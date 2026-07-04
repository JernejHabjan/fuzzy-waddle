import { AppUserRole, GameKey, type CurrentUserProfileDto, UserAccountStatus } from "@fuzzy-waddle/api-interfaces";
import type { ICurrentUserProfileService } from "./current-user-profile.service.interface";

export const currentUserProfileServiceStub = {
  getUserProfile(): Promise<CurrentUserProfileDto | null> {
    return this.getCurrentUserProfile();
  },
  getCurrentUserProfile(): Promise<CurrentUserProfileDto | null> {
    return Promise.resolve({
      id: "user-id",
      email: "user@example.com",
      displayName: "Test User",
      username: "test-user",
      avatarUrl: null,
      bio: "Lives for co-op and leaderboard climbs.",
      locale: "en",
      timezone: "Europe/Ljubljana",
      websiteUrl: "https://example.com",
      role: AppUserRole.User,
      accountStatus: UserAccountStatus.Active,
      bannedUntil: null,
      moderationNote: null,
      isBanned: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
      playSummary: {
        totalSessions: 7,
        completedSessions: 6,
        wins: 4,
        scoreSubmissions: 5,
        achievementsUnlocked: 3,
        preferredGame: GameKey.ProbableWaffle,
        lastPlayedAt: "2026-05-30T00:00:00.000Z",
        gameStats: [
          {
            gameKey: GameKey.ProbableWaffle,
            sessionsPlayed: 4,
            completedSessions: 4,
            wins: 3,
            scoreSubmissions: 2,
            bestScore: 1800,
            achievementsUnlocked: 3,
            lastPlayedAt: "2026-05-30T00:00:00.000Z"
          },
          {
            gameKey: GameKey.FlySquasher,
            sessionsPlayed: 2,
            completedSessions: 1,
            wins: 1,
            scoreSubmissions: 2,
            bestScore: 210,
            achievementsUnlocked: 0,
            lastPlayedAt: "2026-05-21T00:00:00.000Z"
          },
          {
            gameKey: GameKey.LittleMuncher,
            sessionsPlayed: 1,
            completedSessions: 1,
            wins: 0,
            scoreSubmissions: 1,
            bestScore: 89,
            achievementsUnlocked: 0,
            lastPlayedAt: "2026-05-10T00:00:00.000Z"
          }
        ]
      }
    });
  },
  clearCache(): void {}
} satisfies ICurrentUserProfileService;
