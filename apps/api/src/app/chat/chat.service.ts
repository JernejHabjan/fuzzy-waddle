import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { type IChatService } from "./chat.service.interface";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import {
  ChatChannelType,
  ChatMessageStatus,
  GameKey,
  type ChatMessage,
  type GetMessagesResponseDto,
  type ReportChatMessageDto
} from "@fuzzy-waddle/api-interfaces";

@Injectable()
export class ChatService implements IChatService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly textSanitizationService: TextSanitizationService
  ) {}

  /**
   * @returns {Promise<Awaited<string>>} sanitized message
   */
  async postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<ChatMessage> {
    const sanitizedMessage = this.textSanitizationService.cleanBadWords(text);
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
        user_profiles:sender_user_id(display_name)
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
      createdAt: new Date(row.created_at),
      gameInstanceId
    };
  }

  async getMessages(limit: number, offset: number, gameInstanceId?: string): Promise<GetMessagesResponseDto> {
    const supabase = this.supabaseProviderService.supabaseClient;
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
        user_profiles:sender_user_id(display_name)
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
    const messages: ChatMessage[] = (data || [])
      .map((row: any) => ({
        id: row.id,
        text: row.body,
        userId: row.sender_user_id,
        fullName: row.user_profiles?.display_name || "Unknown",
        createdAt: new Date(row.created_at),
        gameInstanceId
      }))
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

    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select("id, sender_user_id")
      .eq("id", messageId)
      .eq("message_status", ChatMessageStatus.Visible)
      .maybeSingle();

    if (messageError) {
      console.error(messageError);
      throw messageError;
    }

    if (!message) {
      throw new NotFoundException("Chat message not found");
    }

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

    if (error.code === "23505") {
      throw new ConflictException("You already reported this message");
    }

    console.error(error);
    throw error;
  }

  private async getOrCreateChannel(gameInstanceId?: string): Promise<{ id: string }> {
    const supabase = this.supabaseProviderService.supabaseClient;

    const existingQuery = gameInstanceId
      ? supabase
          .from("chat_channels")
          .select("id")
          .eq("channel_type", ChatChannelType.GameSession)
          .eq("game_key", GameKey.ProbableWaffle)
          .eq("external_session_id", gameInstanceId)
          .maybeSingle()
      : supabase.from("chat_channels").select("id").eq("channel_type", ChatChannelType.GlobalLobby).maybeSingle();

    const { data: existing, error: existingError } = await existingQuery;
    if (existingError) {
      console.error(existingError);
      throw existingError;
    }
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
      console.error(error);
      throw error;
    }

    return data;
  }
}
