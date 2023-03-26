import { JwtFromRequestFunction } from 'passport-jwt';
import { Strategy } from 'passport-strategy';
import * as NodeCache from 'node-cache';
import { AuthUser, createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_AUTH, UNAUTHORIZED } from './constants';
import { SupabaseAuthStrategyOptions } from './options.interface';

// fixes https://github.com/hiro1107/nestjs-supabase-auth/issues/7
// uses node-cache to cache users for 1 hour
export class SupabaseV2AuthStrategy extends Strategy {
  readonly name = SUPABASE_AUTH;
  private supabase: SupabaseClient;
  private extractor: JwtFromRequestFunction;
  success: (user: any, info: any) => void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  fail: Strategy['fail'];

  cachedUsers = new NodeCache({
    stdTTL: 60 * 60, // cache TTL set to 1 hour
    checkperiod: 60 * 30, // cache checked every 30 minutes
    deleteOnExpire: true // delete expired items from the cache
  });

  constructor(options: SupabaseAuthStrategyOptions) {
    super();
    if (!options.extractor) {
      throw new Error(
        '\n Extractor is not a function. You should provide an extractor. \n Read the docs: https://github.com/tfarras/nestjs-firebase-auth#readme'
      );
    }

    this.supabase = createClient(options.supabaseUrl, options.supabaseKey, (options.supabaseOptions = {}));
    this.extractor = options.extractor;
  }

  async validate(authUser: AuthUser | null): Promise<AuthUser | null> {
    return authUser ? authUser : null;
  }

  async authenticate(req): Promise<void> {
    const idToken = this.extractor(req);

    if (!idToken) {
      this.fail(UNAUTHORIZED, 401);
      return;
    }

    const cachedUser = this.cachedUsers.get<AuthUser>(idToken);
    if (cachedUser) {
      // note that we don't validate against database for cached users for 1 hour until cache expires
      this.success(cachedUser, {});
      return;
    }

    const userResponse = await this.supabase.auth.getUser(idToken);
    const user = await this.validate(userResponse.data.user);

    if (user) {
      this.cachedUsers.set<AuthUser>(idToken, user);
      this.success(user, {});
      return;
    } else {
      this.fail(UNAUTHORIZED, 401);
      return;
    }
  }
}
