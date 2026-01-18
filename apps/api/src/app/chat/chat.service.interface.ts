import { type AuthUser } from "@supabase/supabase-js";
import type { GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";

export interface IChatService {
  postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<string>;
  getMessages(limit: number, offset: number, gameInstanceId?: string): Promise<GetMessagesResponseDto>;
}
