import { Injectable } from "@nestjs/common";
import { IChatService } from "./chat.service.interface";
import { AuthUser } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";

@Injectable()
export class ChatService implements IChatService {
  constructor(
    private supabaseProviderService: SupabaseProviderService,
    private textSanitizationService: TextSanitizationService
  ) {}

  /**
   * @returns {Promise<Awaited<string>>} sanitized message
   */
  async postMessage(text: string, user: AuthUser): Promise<string> {
    const sanitizedMessage = this.textSanitizationService.cleanBadWords(text);
    // Insert sanitized message into Messages table
    const { data, error } = await this.supabaseProviderService.supabaseClient.from("test").insert({
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
}
