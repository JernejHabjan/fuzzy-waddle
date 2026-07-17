import { type JwtFromRequestFunction } from "passport-jwt";
import { SupabaseClient } from "@supabase/supabase-js";
import { UserAuthCacheService } from "@fuzzy-waddle/platform-identity/server/cache/user-auth-cache.service.ts/user-auth-cache.service";

export interface SupabaseAuthStrategyOptions {
  supabaseClient: SupabaseClient;
  extractor: JwtFromRequestFunction;
  userAuthCacheService: UserAuthCacheService;
}
