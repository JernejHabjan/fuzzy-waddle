import type { CurrentUserProfileDto } from "../../current-user-profile";

export interface ICurrentUserProfileService {
  getUserProfile(userId?: string | null, forceRefresh?: boolean): Promise<CurrentUserProfileDto | null>;
  getCurrentUserProfile(forceRefresh?: boolean): Promise<CurrentUserProfileDto | null>;
  clearCache(): void;
}
