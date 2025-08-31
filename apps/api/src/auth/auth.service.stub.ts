import { type AuthUser } from "@supabase/supabase-js";
import { type IAuthService } from "./auth.service.interface";

export const authUserStub: AuthUser = {
  user_metadata: undefined,
  id: undefined,
  app_metadata: {
    provider: undefined
  },
  aud: undefined,
  confirmation_sent_at: undefined,
  confirmed_at: undefined,
  created_at: undefined,
  email: undefined,
  last_sign_in_at: undefined,
  role: undefined
};

export const authServiceStub = {
  validateTest(): Promise<boolean> {
    return Promise.resolve(true);
  }
} satisfies IAuthService;
