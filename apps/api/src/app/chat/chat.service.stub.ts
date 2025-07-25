import { AuthUser } from "@supabase/supabase-js";
import { IChatService } from "./chat.service.interface";

export const chatServiceStub = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postMessage(text: string, user: AuthUser): Promise<string> {
    return Promise.resolve(text);
  }
} satisfies IChatService;
