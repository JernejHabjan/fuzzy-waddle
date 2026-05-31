import type { AppUserRole, UserAccountStatus } from "../database/database-enums";

export interface CurrentUserProfileDto {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: AppUserRole;
  accountStatus: UserAccountStatus;
  bannedUntil: string | null;
  moderationNote: string | null;
  isBanned: boolean;
}
