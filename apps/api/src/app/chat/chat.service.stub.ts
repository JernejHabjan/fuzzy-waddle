import { type AuthUser } from "@supabase/supabase-js";
import { type IChatService } from "./chat.service.interface";
import type { GetMessagesResponseDto } from "@fuzzy-waddle/api-interfaces";

export const chatServiceStub = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(text: string, user: AuthUser, gameInstanceId?: string): Promise<string> {
    return Promise.resolve(text);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMessages(limit: number, offset: number, gameInstanceId?: string): Promise<GetMessagesResponseDto> {
    return Promise.resolve({ messages: [], total: 0, hasMore: false });
  }
} satisfies IChatService;
