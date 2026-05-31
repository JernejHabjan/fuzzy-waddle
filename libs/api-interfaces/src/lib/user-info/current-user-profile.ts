import type { AppUserRole, GameKey, UserAccountStatus } from "../database/database-enums";

export interface UserGameProfileStatDto {
  gameKey: GameKey;
  sessionsPlayed: number;
  completedSessions: number;
  wins: number;
  scoreSubmissions: number;
  bestScore: number | null;
  achievementsUnlocked: number;
  lastPlayedAt: string | null;
}

export interface UserPlaySummaryDto {
  totalSessions: number;
  completedSessions: number;
  wins: number;
  scoreSubmissions: number;
  achievementsUnlocked: number;
  preferredGame: GameKey | null;
  lastPlayedAt: string | null;
  gameStats: UserGameProfileStatDto[];
}

export interface CurrentUserProfileDto {
  id: string;
  email: string | null;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
  websiteUrl: string | null;
  role: AppUserRole;
  accountStatus: UserAccountStatus;
  bannedUntil: string | null;
  moderationNote: string | null;
  isBanned: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  playSummary: UserPlaySummaryDto;
}
