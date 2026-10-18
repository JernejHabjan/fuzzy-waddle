import { type AuthUser } from "@supabase/supabase-js";
import type { BanUserDto } from "../../user-moderation";
import type { CurrentUserProfileDto } from "../../current-user-profile";
import { type AppUserRole } from "@fuzzy-waddle/platform-database-schema";

export interface UserProfilesServiceInterface {
  getCurrentUserProfile(user: AuthUser): Promise<CurrentUserProfileDto>;
  getUserProfile(user: AuthUser, targetUserId: string): Promise<CurrentUserProfileDto | null>;
  ensureOnlineAccess(userId: string): Promise<void>;
  ensureModerator(userId: string): Promise<typeof AppUserRole.Moderator | typeof AppUserRole.Admin>;
  banUser(targetUserId: string, actorUserId: string, body: BanUserDto): Promise<void>;
  unbanUser(targetUserId: string, actorUserId: string): Promise<void>;
}
