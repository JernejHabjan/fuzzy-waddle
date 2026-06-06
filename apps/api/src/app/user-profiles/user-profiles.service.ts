import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { type AuthUser } from "@supabase/supabase-js";
import {
  AppUserRole,
  type BanUserDto,
  type CurrentUserProfileDto,
  GameKey,
  UserAccountStatus
} from "@fuzzy-waddle/api-interfaces";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";

type UserProfileRow = {
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
  website_url: string | null;
  app_role: AppUserRole | null;
  account_status: UserAccountStatus | null;
  banned_until: string | null;
  moderation_note: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ParticipantProfileRow = {
  result_status: "win" | "loss" | "tie" | "quit" | null;
  game_sessions:
    | {
        game_key: GameKey | null;
        started_at: string | null;
        completed_at: string | null;
        ended_at: string | null;
        session_status: string | null;
      }
    | {
        game_key: GameKey | null;
        started_at: string | null;
        completed_at: string | null;
        ended_at: string | null;
        session_status: string | null;
      }[]
    | null;
};

type ScoreProfileRow = {
  game_key: GameKey | null;
  score_value: number | null;
  submitted_at: string | null;
};

type AchievementUnlockRow = {
  achievement_definitions:
    | {
        game_key: GameKey | null;
      }
    | {
        game_key: GameKey | null;
      }[]
    | null;
};

@Injectable()
export class UserProfilesService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async getCurrentUserProfile(user: AuthUser): Promise<CurrentUserProfileDto> {
    const profile = await this.getUserProfile(user, user.id);
    if (!profile) {
      throw new ForbiddenException("Profile not found");
    }

    return profile;
  }

  async getUserProfile(user: AuthUser, targetUserId: string): Promise<CurrentUserProfileDto | null> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("user_profiles")
      .select(
        "email, display_name, username, avatar_url, bio, locale, timezone, website_url, app_role, account_status, banned_until, moderation_note, created_at, updated_at"
      )
      .eq("id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    const profile = data as UserProfileRow | null;
    if (!profile) {
      return null;
    }

    const isViewerSelf = user.id === targetUserId;
    const accountStatus = profile?.account_status ?? UserAccountStatus.Active;
    if (!isViewerSelf && accountStatus !== UserAccountStatus.Active) {
      return null;
    }

    const bannedUntil = profile?.banned_until ?? null;
    const playSummary = await this.getPlaySummary(targetUserId);

    return {
      id: targetUserId,
      email: isViewerSelf ? (profile.email ?? user.email ?? null) : null,
      displayName: profile.display_name ?? (isViewerSelf ? user.email?.split("@")[0] : undefined) ?? "Unknown",
      username: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      bio: profile?.bio ?? null,
      locale: profile?.locale ?? null,
      timezone: profile?.timezone ?? null,
      websiteUrl: profile?.website_url ?? null,
      role: profile?.app_role ?? AppUserRole.User,
      accountStatus,
      bannedUntil,
      moderationNote: isViewerSelf ? (profile?.moderation_note ?? null) : null,
      isBanned:
        accountStatus === UserAccountStatus.Disabled ||
        (bannedUntil != null && new Date(bannedUntil).getTime() > Date.now()),
      createdAt: profile?.created_at ?? (isViewerSelf ? user.created_at : null) ?? null,
      updatedAt: profile?.updated_at ?? null,
      playSummary
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

  async ensureModerator(userId: string): Promise<typeof AppUserRole.Moderator | typeof AppUserRole.Admin> {
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
      bannedUntil && new Date(bannedUntil).getTime() > Date.now()
        ? UserAccountStatus.Limited
        : UserAccountStatus.Disabled;

    const { error } = await this.supabaseProviderService.supabaseClient
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

    const { error } = await this.supabaseProviderService.supabaseClient
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
    const { data, error } = await this.supabaseProviderService.supabaseClient
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
      appRole: (data?.app_role as AppUserRole) ?? AppUserRole.User,
      bannedUntil: data?.banned_until ?? null
    };
  }

  private async getPlaySummary(userId: string): Promise<CurrentUserProfileDto["playSummary"]> {
    const [participantsResult, scoresResult, achievementsResult] = await Promise.all([
      this.supabaseProviderService.supabaseClient
        .from("game_session_participants")
        .select("result_status, game_sessions!inner(game_key, started_at, completed_at, ended_at, session_status)")
        .eq("user_id", userId),
      this.supabaseProviderService.supabaseClient
        .from("game_score_records")
        .select("game_key, score_value, submitted_at")
        .eq("user_id", userId),
      this.supabaseProviderService.supabaseClient
        .from("user_achievement_unlocks")
        .select("achievement_definitions!inner(game_key)")
        .eq("user_id", userId)
    ]);

    if (participantsResult.error) {
      console.error(participantsResult.error);
      throw participantsResult.error;
    }

    if (scoresResult.error) {
      console.error(scoresResult.error);
      throw scoresResult.error;
    }

    if (achievementsResult.error) {
      console.error(achievementsResult.error);
      throw achievementsResult.error;
    }

    const knownGames = new Set<GameKey>([GameKey.ProbableWaffle, GameKey.LittleMuncher, GameKey.FlySquasher]);
    const gameStats = new Map<
      GameKey,
      {
        gameKey: GameKey;
        sessionsPlayed: number;
        completedSessions: number;
        wins: number;
        scoreSubmissions: number;
        bestScore: number | null;
        achievementsUnlocked: number;
        lastPlayedAt: string | null;
      }
    >();

    const ensureStat = (gameKey: GameKey) => {
      let stat = gameStats.get(gameKey);
      if (!stat) {
        stat = {
          gameKey,
          sessionsPlayed: 0,
          completedSessions: 0,
          wins: 0,
          scoreSubmissions: 0,
          bestScore: null,
          achievementsUnlocked: 0,
          lastPlayedAt: null
        };
        gameStats.set(gameKey, stat);
      }

      return stat;
    };

    for (const participant of (participantsResult.data ?? []) as ParticipantProfileRow[]) {
      const session = Array.isArray(participant.game_sessions)
        ? participant.game_sessions[0]
        : participant.game_sessions;
      const gameKey = session?.game_key;
      if (!gameKey || !knownGames.has(gameKey)) {
        continue;
      }

      const stat = ensureStat(gameKey);
      stat.sessionsPlayed += 1;

      if (session.session_status === "completed") {
        stat.completedSessions += 1;
      }

      if (participant.result_status === "win") {
        stat.wins += 1;
      }

      const playedAt = session.completed_at ?? session.ended_at ?? session.started_at;
      if (playedAt && (!stat.lastPlayedAt || new Date(playedAt).getTime() > new Date(stat.lastPlayedAt).getTime())) {
        stat.lastPlayedAt = playedAt;
      }
    }

    for (const score of (scoresResult.data ?? []) as ScoreProfileRow[]) {
      const gameKey = score.game_key;
      if (!gameKey || !knownGames.has(gameKey)) {
        continue;
      }

      const stat = ensureStat(gameKey);
      stat.scoreSubmissions += 1;
      if (score.score_value != null) {
        stat.bestScore = stat.bestScore == null ? score.score_value : Math.max(stat.bestScore, score.score_value);
      }
      if (
        score.submitted_at &&
        (!stat.lastPlayedAt || new Date(score.submitted_at).getTime() > new Date(stat.lastPlayedAt).getTime())
      ) {
        stat.lastPlayedAt = score.submitted_at;
      }
    }

    for (const unlock of (achievementsResult.data ?? []) as AchievementUnlockRow[]) {
      const definition = Array.isArray(unlock.achievement_definitions)
        ? unlock.achievement_definitions[0]
        : unlock.achievement_definitions;
      const gameKey = definition?.game_key;
      if (!gameKey || !knownGames.has(gameKey)) {
        continue;
      }

      ensureStat(gameKey).achievementsUnlocked += 1;
    }

    const stats = Array.from(gameStats.values()).sort((left, right) => {
      if (right.sessionsPlayed !== left.sessionsPlayed) {
        return right.sessionsPlayed - left.sessionsPlayed;
      }

      if (right.scoreSubmissions !== left.scoreSubmissions) {
        return right.scoreSubmissions - left.scoreSubmissions;
      }

      return (new Date(right.lastPlayedAt ?? 0).getTime() || 0) - (new Date(left.lastPlayedAt ?? 0).getTime() || 0);
    });

    return {
      totalSessions: stats.reduce((sum, stat) => sum + stat.sessionsPlayed, 0),
      completedSessions: stats.reduce((sum, stat) => sum + stat.completedSessions, 0),
      wins: stats.reduce((sum, stat) => sum + stat.wins, 0),
      scoreSubmissions: stats.reduce((sum, stat) => sum + stat.scoreSubmissions, 0),
      achievementsUnlocked: stats.reduce((sum, stat) => sum + stat.achievementsUnlocked, 0),
      preferredGame: stats[0]?.gameKey ?? null,
      lastPlayedAt:
        stats
          .map((stat) => stat.lastPlayedAt)
          .filter((value): value is string => value != null)
          .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null,
      gameStats: stats
    };
  }
}
