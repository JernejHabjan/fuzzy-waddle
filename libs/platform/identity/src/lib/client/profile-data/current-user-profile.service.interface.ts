import type { CurrentUserProfileDto } from "@fuzzy-waddle/platform-identity";

export interface ICurrentUserProfileService {
  getUserProfile(userId?: string | null, forceRefresh?: boolean): Promise<CurrentUserProfileDto | null>;
  getCurrentUserProfile(forceRefresh?: boolean): Promise<CurrentUserProfileDto | null>;
  clearCache(): void;
}
