import { type AuthUser } from "@supabase/supabase-js";
import { type IChatService } from "./chat.service.interface";
import { type ChatMessage } from "@fuzzy-waddle/api-interfaces";

export const chatServiceStub = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(text: string, user: AuthUser): Promise<string> {
    return Promise.resolve(text);
  },
  getMessages(limit?: number): Promise<ChatMessage[]> {
    return Promise.resolve([]);
  }
} satisfies IChatService;
