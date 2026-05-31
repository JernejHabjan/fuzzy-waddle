import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import {
  AppUserRole,
  type BanUserDto,
  type CurrentUserProfileDto,
  UserAccountStatus
} from "@fuzzy-waddle/api-interfaces";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";

@Injectable()
export class UserProfilesService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async getCurrentUserProfile(user: AuthUser): Promise<CurrentUserProfileDto> {
    const { data, error } = await (this.supabaseProviderService.supabaseClient as any)
      .from("user_profiles")
      .select("id, email, display_name, avatar_url, app_role, account_status, banned_until, moderation_note")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    const accountStatus = data?.account_status ?? UserAccountStatus.Active;
    const bannedUntil = data?.banned_until ?? null;

    return {
      id: user.id,
      email: data?.email ?? user.email ?? null,
      displayName: data?.display_name ?? user.email?.split("@")[0] ?? "Unknown",
      avatarUrl: data?.avatar_url ?? null,
      role: data?.app_role ?? AppUserRole.User,
      accountStatus,
      bannedUntil,
      moderationNote: data?.moderation_note ?? null,
      isBanned:
        accountStatus === UserAccountStatus.Disabled ||
        (bannedUntil != null && new Date(bannedUntil).getTime() > Date.now())
    };
  }

  async ensureOnlineAccess(userId: string): Promise<void> {
    const profile = await this.getProfileAccessState(userId);

    if (profile.accountStatus === UserAccountStatus.Disabled) {
      throw new ForbiddenException("User is banned");
    }

    if (profile.bannedUntil != null && new Date(profile.bannedUntil).getTime() > Date.now()) {
      throw new ForbiddenException("User is temporarily banned");
    }
  }

  async ensureModerator(userId: string): Promise<AppUserRole.Moderator | AppUserRole.Admin> {
    const profile = await this.getProfileAccessState(userId);

    if (profile.accountStatus === UserAccountStatus.Disabled) {
      throw new ForbiddenException("User is disabled");
    }

    if (profile.appRole === AppUserRole.Moderator || profile.appRole === AppUserRole.Admin) {
      return profile.appRole;
    }

    throw new ForbiddenException("Moderator access required");
  }

  async banUser(targetUserId: string, actorUserId: string, body: BanUserDto): Promise<void> {
    await this.ensureModerator(actorUserId);
    if (targetUserId === actorUserId) {
      throw new BadRequestException("You cannot ban yourself");
    }

    const bannedUntil = body.bannedUntil ?? null;
    const accountStatus =
      bannedUntil && new Date(bannedUntil).getTime() > Date.now() ? UserAccountStatus.Limited : UserAccountStatus.Disabled;

    const { error } = await (this.supabaseProviderService.supabaseClient as any)
      .from("user_profiles")
      .update({
        account_status: accountStatus,
        banned_until: bannedUntil,
        moderation_note: body.moderationNote?.trim() || "Banned by moderator"
      })
      .eq("id", targetUserId);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  async unbanUser(targetUserId: string, actorUserId: string): Promise<void> {
    await this.ensureModerator(actorUserId);
    if (targetUserId === actorUserId) {
      throw new BadRequestException("You cannot unban yourself");
    }

    const { error } = await (this.supabaseProviderService.supabaseClient as any)
      .from("user_profiles")
      .update({
        account_status: UserAccountStatus.Active,
        banned_until: null,
        moderation_note: null
      })
      .eq("id", targetUserId);

    if (error) {
      console.error(error);
      throw error;
    }
  }

  private async getProfileAccessState(userId: string): Promise<{
    accountStatus: UserAccountStatus;
    appRole: AppUserRole;
    bannedUntil: string | null;
  }> {
    const { data, error } = await (this.supabaseProviderService.supabaseClient as any)
      .from("user_profiles")
      .select("account_status, app_role, banned_until")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    return {
      accountStatus: data?.account_status ?? UserAccountStatus.Active,
      appRole: data?.app_role ?? AppUserRole.User,
      bannedUntil: data?.banned_until ?? null
    };
  }
}
