import { Injectable } from "@nestjs/common";
import { type IChatService } from "./chat.service.interface";
import { type AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { type ChatMessage } from "@fuzzy-waddle/api-interfaces";

interface MessageRow {
  text: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name?: string;
  };
}

@Injectable()
export class ChatService implements IChatService {
  constructor(
    private readonly supabaseProviderService: SupabaseProviderService,
    private readonly textSanitizationService: TextSanitizationService
  ) {}

  /**
   * @returns {Promise<Awaited<string>>} sanitized message
   */
  async postMessage(text: string, user: AuthUser): Promise<string> {
    const sanitizedMessage = this.textSanitizationService.cleanBadWords(text);
    // Insert sanitized message into Messages table
    const { data, error } = await this.supabaseProviderService.supabaseClient.from("messages").insert({
      text: sanitizedMessage,
      user_id: user.id
    });
    if (error) {
      console.error(error);
      return Promise.reject(error);
    } else {
      return Promise.resolve(sanitizedMessage);
    }
  }

  async getMessages(limit = 50): Promise<ChatMessage[]> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("messages")
      .select("id, created_at, text, user_id, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(error);
      return Promise.reject(error);
    }

    // Map the data to ChatMessage format
    const messages: ChatMessage[] = (data || []).map((msg: MessageRow) => ({
      text: msg.text,
      userId: msg.user_id,
      fullName: msg.profiles?.full_name || "Unknown User",
      createdAt: new Date(msg.created_at)
    }));

    // Reverse to get oldest first
    return messages.reverse();
  }
}
