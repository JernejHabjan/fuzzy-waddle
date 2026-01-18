import { type AuthUser } from "@supabase/supabase-js";
import { type ChatMessage } from "@fuzzy-waddle/api-interfaces";

export interface IChatService {
  postMessage(text: string, user: AuthUser): Promise<string>;
  getMessages(limit?: number): Promise<ChatMessage[]>;
}
