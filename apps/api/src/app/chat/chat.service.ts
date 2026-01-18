import { Injectable } from "@nestjs/common";
import { type IChatService } from "./chat.service.interface";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import type { ChatMessage, GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";

@Injectable()
export class ChatService implements IChatService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly textSanitizationService: TextSanitizationService
  ) {}

  /**
   * @returns {Promise<Awaited<string>>} sanitized message
   */
  async postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<string> {
    const sanitizedMessage = this.textSanitizationService.cleanBadWords(text);
    // Insert sanitized message into Messages table
    const insertData: { text: string; user_id: string; game_instance_id?: string } = {
      text: sanitizedMessage,
      user_id: user.id
    };
    if (gameInstanceId) {
      insertData.game_instance_id = gameInstanceId;
    }
    const { error } = await this.supabaseProviderService.supabaseClient.from("messages").insert(insertData);
    if (error) {
      console.error(error);
      return Promise.reject(error);
    } else {
      return Promise.resolve(sanitizedMessage);
    }
  }

  async getMessages(limit: number, offset: number, gameInstanceId?: string): Promise<GetMessagesResponseDto> {
    const supabase = this.supabaseProviderService.supabaseClient;

    // Build query for messages
    let query = supabase
      .from("messages")
      .select(
        `
        id,
        text,
        user_id,
        created_at,
        game_instance_id,
        profiles!messages_user_id_fkey (full_name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by game_instance_id
    if (gameInstanceId) {
      query = query.eq("game_instance_id", gameInstanceId);
    } else {
      query = query.is("game_instance_id", null);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error(error);
      throw error;
    }

    // Map the data to ChatMessage format and reverse to get chronological order
    const messages: ChatMessage[] = (data || [])
      .map((row: any) => ({
        id: row.id,
        text: row.text,
        userId: row.user_id,
        fullName: row.profiles?.full_name || "Unknown",
        createdAt: new Date(row.created_at),
        gameInstanceId: row.game_instance_id
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
}
