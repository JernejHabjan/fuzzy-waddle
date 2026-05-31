import type { CurrentUserProfileDto } from "@fuzzy-waddle/api-interfaces";

export interface ICurrentUserProfileService {
  getCurrentUserProfile(forceRefresh?: boolean): Promise<CurrentUserProfileDto | null>;
  clearCache(): void;
}
