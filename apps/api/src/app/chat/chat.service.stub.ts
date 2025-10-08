import { type AuthUser } from "@supabase/supabase-js";
import { type IChatService } from "./chat.service.interface";

export const chatServiceStub = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(text: string, user: AuthUser): Promise<string> {
    return Promise.resolve(text);
  }
} satisfies IChatService;
