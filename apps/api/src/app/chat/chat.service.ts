import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { type IChatService } from "./chat.service.interface";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import {
  ChatChannelType,
  ChatMessageStatus,
  ChatReportStatus,
  AppUserRole,
  GameKey,
  type BanUserDto,
  type ChatMessage,
  type GetMessagesResponseDto,
  type ModerationQueueDto,
  type ModerationReportDto,
  type ModerationSummaryDto,
  type ReportChatMessageDto,
  type UpdateChatReportStatusDto
} from "@fuzzy-waddle/api-interfaces";
import { POSTGRES_ERROR_CODES } from "../../core/database/postgres-error-codes";
import { UserProfilesService } from "../user-profiles/user-profiles.service";
import { GameInstanceService } from "../probable-waffle/game-instance/game-instance.service";

@Injectable()
export class ChatService implements IChatService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly textSanitizationService: TextSanitizationService,
    private readonly userProfilesService: UserProfilesService,
    @Inject(forwardRef(() => GameInstanceService))
    private readonly probableWaffleGameInstanceService: GameInstanceService
  ) {}

  /**
   * @returns {Promise<Awaited<string>>} sanitized message
   */
  async postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<ChatMessage> {
    const sanitizedMessage = this.textSanitizationService.cleanBadWords(text);
    this.ensureCanAccessGameChat(gameInstanceId, user);
    const supabase = this.supabaseProviderService.supabaseClient;
    const channel = await this.getOrCreateChannel(gameInstanceId);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        channel_id: channel.id,
        sender_user_id: user.id,
        body: sanitizedMessage
      })
      .select(
        `
        id,
        body,
        sender_user_id,
        created_at,
        user_profiles:sender_user_id(display_name, app_role)
      `
      )
      .single();

    if (error) {
      console.error(error);
      return Promise.reject(error);
    }

    const row = data as any;
    return {
      id: row.id,
      text: row.body,
      userId: row.sender_user_id,
      fullName: row.user_profiles?.display_name || "Unknown",
      senderRole: row.user_profiles?.app_role ?? AppUserRole.User,
      createdAt: new Date(row.created_at),
      gameInstanceId
    };
  }

  async getMessages(
    limit: number,
    offset: number,
    gameInstanceId: string | undefined,
    user: AuthUser
  ): Promise<GetMessagesResponseDto> {
    const supabase = this.supabaseProviderService.supabaseClient;
    this.ensureCanAccessGameChat(gameInstanceId, user);
    const channel = await this.getOrCreateChannel(gameInstanceId);

    const { data, count, error } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        body,
        sender_user_id,
        created_at,
        channel_id,
        user_profiles:sender_user_id(display_name, app_role)
      `,
        { count: "exact" }
      )
      .eq("channel_id", channel.id)
      .eq("message_status", ChatMessageStatus.Visible)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(error);
      throw error;
    }

    // Map the data to ChatMessage format and reverse to get chronological order
    const rows = (data || []) as any[];
    const reportStatusByMessageId = await this.getCurrentUserReportStatusByMessageId(
      rows.map((row) => row.id),
      user.id
    );

    const messages: ChatMessage[] = rows
      .map((row: any) => {
        const reportStatus = reportStatusByMessageId.get(row.id) ?? null;
        return {
          id: row.id,
          text: row.body,
          userId: row.sender_user_id,
          fullName: row.user_profiles?.display_name || "Unknown",
          senderRole: row.user_profiles?.app_role ?? AppUserRole.User,
          createdAt: new Date(row.created_at),
          gameInstanceId,
          reportedByCurrentUser: reportStatus != null,
          currentUserReportStatus: reportStatus
        };
      })
      .reverse();

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      messages,
      total,
      hasMore
    };
  }

  async reportMessage(messageId: number, user: AuthUser, report: ReportChatMessageDto): Promise<void> {
    const supabase = this.supabaseProviderService.supabaseClient;
    const message = await this.getReportableMessage(messageId, user);

    if (message.sender_user_id === user.id) {
      throw new BadRequestException("You cannot report your own message");
    }

    const details = report.details?.trim() || null;
    const { error } = await supabase.from("chat_message_reports").insert({
      message_id: messageId,
      reporter_user_id: user.id,
      reason: report.reason,
      details
    });

    if (!error) {
      return;
    }

    if (error.code === POSTGRES_ERROR_CODES.UNIQUENESS_VIOLATION) {
      throw new ConflictException("You already reported this message");
    }

    console.error(error);
    throw error;
  }

  async getModerationSummary(user: AuthUser): Promise<ModerationSummaryDto> {
    const role = await this.userProfilesService.ensureModerator(user.id);
    const { count, error } = await this.supabaseProviderService.supabaseClient
      .from("chat_message_reports")
      .select("id", { count: "exact", head: true })
      .eq("report_status", ChatReportStatus.Open);

    if (error) {
      console.error(error);
      throw error;
    }

    return { role, pendingReportCount: count ?? 0 };
  }

  async getModerationReports(user: AuthUser): Promise<ModerationQueueDto> {
    await this.userProfilesService.ensureModerator(user.id);
    const supabase = this.supabaseProviderService.supabaseClient;

    const { data: reportRows, error: reportError } = await supabase
      .from("chat_message_reports")
      .select("id, message_id, reporter_user_id, reason, details, report_status, created_at")
      .eq("report_status", ChatReportStatus.Open)
      .order("created_at", { ascending: true });

    if (reportError) {
      console.error(reportError);
      throw reportError;
    }

    const reports = (reportRows || []) as any[];
    const messageIds = [...new Set(reports.map((report) => report.message_id))];
    const { data: messageRows, error: messageError } = await supabase
      .from("chat_messages")
      .select("id, body, sender_user_id, created_at")
      .in("id", messageIds.length > 0 ? messageIds : [-1]);

    if (messageError) {
      console.error(messageError);
      throw messageError;
    }

    const messageById = new Map((messageRows || []).map((message: any) => [message.id, message]));
    const profileIds = [
      ...new Set(
        reports
          .flatMap((report) => [report.reporter_user_id, messageById.get(report.message_id)?.sender_user_id])
          .filter(Boolean)
      )
    ];
    const { data: profileRows, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, display_name, email, app_role, account_status, banned_until")
      .in("id", profileIds.length > 0 ? profileIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profileError) {
      console.error(profileError);
      throw profileError;
    }

    const profileById = new Map((profileRows || []).map((profile: any) => [profile.id, profile]));
    const reportDtos: ModerationReportDto[] = reports.map((report: any) => {
      const message = messageById.get(report.message_id);
      const reportedUserId = message?.sender_user_id ?? null;
      return {
        id: report.id,
        messageId: report.message_id,
        reason: report.reason,
        details: report.details,
        reportStatus: report.report_status,
        createdAt: new Date(report.created_at),
        reporterUserId: report.reporter_user_id,
        reporterDisplayName: profileById.get(report.reporter_user_id)?.display_name ?? "Unknown",
        reporterEmail: profileById.get(report.reporter_user_id)?.email ?? null,
        reportedUserId,
        reportedUserDisplayName: reportedUserId
          ? (profileById.get(reportedUserId)?.display_name ?? "Unknown")
          : "Unknown",
        reportedUserEmail: reportedUserId ? (profileById.get(reportedUserId)?.email ?? null) : null,
        reportedUserRole: reportedUserId ? (profileById.get(reportedUserId)?.app_role ?? null) : null,
        messageText: message?.body ?? "",
        messageCreatedAt: new Date(message?.created_at ?? report.created_at)
      };
    });

    const groupsByUser = new Map<string, ModerationReportDto[]>();
    for (const report of reportDtos) {
      const key = report.reportedUserId ?? "deleted-user";
      groupsByUser.set(key, [...(groupsByUser.get(key) ?? []), report]);
    }

    const { data: bannedUsersRows, error: bannedUsersError } = await supabase
      .from("user_profiles")
      .select("id, display_name, email, app_role, account_status, banned_until, moderation_note, updated_at")
      .or("account_status.eq.disabled,account_status.eq.limited,banned_until.not.is.null");

    if (bannedUsersError) {
      console.error(bannedUsersError);
      throw bannedUsersError;
    }

    const bannedUsers = ((bannedUsersRows || []) as any[])
      .filter(
        (profile) =>
          profile.account_status === "disabled" ||
          profile.account_status === "limited" ||
          profile.banned_until != null
      )
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .map((profile) => ({
        userId: profile.id,
        displayName: profile.display_name ?? "Unknown",
        email: profile.email ?? null,
        role: profile.app_role ?? null,
        accountStatus: profile.account_status,
        bannedUntil: profile.banned_until ?? null,
        moderationNote: profile.moderation_note ?? null,
        updatedAt: new Date(profile.updated_at)
      }));

    return {
      pendingReportCount: reportDtos.length,
      bannedUsers,
      groups: [...groupsByUser.entries()].map(([reportedUserId, groupReports]) => ({
        reportedUserId: reportedUserId === "deleted-user" ? null : reportedUserId,
        reportedUserDisplayName: groupReports[0]?.reportedUserDisplayName ?? "Unknown",
        reportedUserEmail: groupReports[0]?.reportedUserEmail ?? null,
        reportedUserRole: groupReports[0]?.reportedUserRole ?? null,
        reportedUserAccountStatus:
          reportedUserId === "deleted-user" ? null : (profileById.get(reportedUserId)?.account_status ?? null),
        reportedUserBannedUntil:
          reportedUserId === "deleted-user" ? null : (profileById.get(reportedUserId)?.banned_until ?? null),
        reports: groupReports
      }))
    };
  }

  async updateReportStatus(reportId: number, user: AuthUser, body: UpdateChatReportStatusDto): Promise<void> {
    await this.userProfilesService.ensureModerator(user.id);
    const supabase = this.supabaseProviderService.supabaseClient;
    const { data: report, error: reportError } = await supabase
      .from("chat_message_reports")
      .select("id, message_id")
      .eq("id", reportId)
      .maybeSingle();

    if (reportError) {
      console.error(reportError);
      throw reportError;
    }
    if (!report) {
      throw new NotFoundException("Chat report not found");
    }

    const { error } = await supabase
      .from("chat_message_reports")
      .update({
        report_status: body.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq("id", reportId);

    if (error) {
      console.error(error);
      throw error;
    }

    if (body.status === ChatReportStatus.Actioned) {
      const { error: messageError } = await supabase
        .from("chat_messages")
        .update({
          message_status: ChatMessageStatus.Hidden,
          moderation_reason: "Reported message actioned by moderator"
        })
        .eq("id", report.message_id);

      if (messageError) {
        console.error(messageError);
        throw messageError;
      }
    }
  }

  async banUser(userId: string, user: AuthUser, body: BanUserDto): Promise<void> {
    await this.userProfilesService.banUser(userId, user.id, body);
  }

  async unbanUser(userId: string, user: AuthUser): Promise<void> {
    await this.userProfilesService.unbanUser(userId, user.id);
  }

  private async getOrCreateChannel(gameInstanceId?: string): Promise<{ id: string }> {
    const supabase = this.supabaseProviderService.supabaseClient;
    const existing = await this.findChannel(gameInstanceId);
    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from("chat_channels")
      .insert(
        gameInstanceId
          ? {
              channel_type: ChatChannelType.GameSession,
              game_key: GameKey.ProbableWaffle,
              external_session_id: gameInstanceId,
              title: "Probable Waffle Game"
            }
          : {
              channel_type: ChatChannelType.GlobalLobby,
              title: "Global Lobby"
            }
      )
      .select("id")
      .single();

    if (error) {
      // Two first-time callers can race; after a unique violation, re-read the winner.
      if (error.code === POSTGRES_ERROR_CODES.UNIQUENESS_VIOLATION) {
        const channel = await this.findChannel(gameInstanceId);
        if (channel) {
          return channel;
        }
      }

      console.error(error);
      throw error;
    }

    return data;
  }

  private async getReportableMessage(
    messageId: number,
    user: AuthUser
  ): Promise<{
    id: number;
    sender_user_id: string | null;
    chat_channels: {
      channel_type: ChatChannelType;
      external_session_id: string | null;
    } | null;
  }> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("chat_messages")
      .select("id, sender_user_id, chat_channels!inner(channel_type, external_session_id)")
      .eq("id", messageId)
      .eq("message_status", ChatMessageStatus.Visible)
      .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data) {
      throw new NotFoundException("Chat message not found");
    }

    const channel = Array.isArray(data.chat_channels) ? data.chat_channels[0] : data.chat_channels;
    // Treat inaccessible private chat as "not found" so ids cannot be probed across rooms.
    if (channel?.channel_type === ChatChannelType.GameSession) {
      const gameInstanceId = channel.external_session_id ?? undefined;
      if (!gameInstanceId) {
        throw new NotFoundException("Chat message not found");
      }

      try {
        this.ensureCanAccessGameChat(gameInstanceId, user);
      } catch {
        throw new NotFoundException("Chat message not found");
      }
    }

    return {
      id: data.id,
      sender_user_id: data.sender_user_id,
      chat_channels: channel
        ? {
            channel_type: channel.channel_type as ChatChannelType,
            external_session_id: channel.external_session_id
          }
        : null
    };
  }

  private async findChannel(gameInstanceId?: string): Promise<{ id: string } | null> {
    const existingQuery = gameInstanceId
      ? this.supabaseProviderService.supabaseClient
          .from("chat_channels")
          .select("id")
          .eq("channel_type", ChatChannelType.GameSession)
          .eq("game_key", GameKey.ProbableWaffle)
          .eq("external_session_id", gameInstanceId)
          .maybeSingle()
      : this.supabaseProviderService.supabaseClient
          .from("chat_channels")
          .select("id")
          .eq("channel_type", ChatChannelType.GlobalLobby)
          .maybeSingle();

    const { data, error } = await existingQuery;
    if (error) {
      console.error(error);
      throw error;
    }

    return data;
  }

  private async getCurrentUserReportStatusByMessageId(
    messageIds: number[],
    userId: string
  ): Promise<Map<number, ChatReportStatus>> {
    if (messageIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("chat_message_reports")
      .select("message_id, report_status")
      .eq("reporter_user_id", userId)
      .in("message_id", messageIds);

    if (error) {
      console.error(error);
      throw error;
    }

    return new Map((data || []).map((row: any) => [row.message_id, row.report_status]));
  }

  private ensureCanAccessGameChat(gameInstanceId: string | undefined, user: AuthUser): void {
    if (!gameInstanceId) {
      return;
    }

    this.probableWaffleGameInstanceService.ensureCanJoinGameRoom(gameInstanceId, user);
  }
}
