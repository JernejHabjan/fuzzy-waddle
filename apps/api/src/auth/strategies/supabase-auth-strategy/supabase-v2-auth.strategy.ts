import { type JwtFromRequestFunction } from "passport-jwt";
import Strategy from "passport-strategy";
import { type AuthUser, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_AUTH, UNAUTHORIZED } from "./constants";
import { type SupabaseAuthStrategyOptions } from "./options.interface";
import { UserAuthCacheService } from "../../../core/cache/user-auth-cache.service.ts/user-auth-cache.service";

// fixes https://github.com/hiro1107/nestjs-supabase-auth/issues/7
// uses node-cache to cache users for 1 hour
export class SupabaseV2AuthStrategy extends Strategy {
  readonly name = SUPABASE_AUTH;
  private extractor: JwtFromRequestFunction;
  success!: (user: any, info: any) => void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  fail!: Strategy["fail"];
  private readonly userAuthCacheService: UserAuthCacheService;
  private supabaseClient: SupabaseClient;

  constructor(options: SupabaseAuthStrategyOptions) {
    super();
    this.userAuthCacheService = options.userAuthCacheService;
    this.supabaseClient = options.supabaseClient;
    if (!options.extractor) {
      throw new Error(
        "\n Extractor is not a function. You should provide an extractor. \n Read the docs: https://github.com/tfarras/nestjs-firebase-auth#readme"
      );
    }
    this.extractor = options.extractor;
  }

  async validate(authUser: AuthUser | null): Promise<AuthUser | null> {
    return authUser ? authUser : null;
  }

  async authenticate(req: any): Promise<void> {
    const idToken = this.extractor(req);

    if (!idToken) {
      this.fail(UNAUTHORIZED, 401);
      return;
    }

    const cachedUser = this.userAuthCacheService.getUser(idToken);
    if (cachedUser) {
      // note that we don't validate against database for cached users for 1 hour until cache expires
      this.success(cachedUser, {});
      return;
    }

    const userResponse = await this.supabaseClient.auth.getUser(idToken);
    const user = await this.validate(userResponse.data.user);

    if (user) {
      this.userAuthCacheService.setUser(idToken, user);
      this.success(user, {});
      return;
    } else {
      this.fail(UNAUTHORIZED, 401);
      return;
    }
  }
}
