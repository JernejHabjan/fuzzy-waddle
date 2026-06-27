import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { type IChatService } from "./chat.service.interface";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import {
  AppUserRole,
  ChatChannelType,
  type ChatMessage,
  ChatMessageStatus,
  ChatReportStatus,
  GameKey,
  type GetMessagesResponseDto,
  type ReportChatMessageDto
} from "@fuzzy-waddle/api-interfaces";
import { POSTGRES_ERROR_CODES } from "../../core/database/postgres-error-codes";
import { GameInstanceService } from "../probable-waffle/game-instance/game-instance.service";

@Injectable()
export class ChatService implements IChatService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly textSanitizationService: TextSanitizationService,
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

    const row = data;
    return {
      id: row.id,
      text: row.body,
      userId: row.sender_user_id!,
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
    const rows = data || [];
    const reportStatusByMessageId = await this.getCurrentUserReportStatusByMessageId(
      rows.map((row) => row.id),
      user.id
    );

    const messages = rows
      .map((row) => {
        const reportStatus = reportStatusByMessageId.get(row.id) ?? null;
        return {
          id: row.id,
          text: row.body,
          userId: row.sender_user_id!,
          fullName: row.user_profiles?.display_name || "Unknown",
          senderRole: row.user_profiles?.app_role ?? AppUserRole.User,
          createdAt: new Date(row.created_at),
          gameInstanceId,
          reportedByCurrentUser: reportStatus != null,
          currentUserReportStatus: reportStatus
        } satisfies ChatMessage;
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

    return new Map((data || []).map((row) => [row.message_id, row.report_status]));
  }

  private ensureCanAccessGameChat(gameInstanceId: string | undefined, user: AuthUser): void {
    if (!gameInstanceId) {
      return;
    }

    this.probableWaffleGameInstanceService.ensureCanJoinGameRoom(gameInstanceId, user);
  }
}
