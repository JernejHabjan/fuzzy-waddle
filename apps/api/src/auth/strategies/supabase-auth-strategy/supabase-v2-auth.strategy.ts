import { Request } from "express";
import { JwtFromRequestFunction } from "passport-jwt";
import { Strategy } from "passport-strategy";

import {
  AuthUser,
  createClient,
  SupabaseClient
} from '@supabase/supabase-js';
import { UNAUTHORIZED, SUPABASE_AUTH } from "./constants";
import { SupabaseAuthStrategyOptions } from './options.interface';

// fixes https://github.com/hiro1107/nestjs-supabase-auth/issues/7
export class SupabaseV2AuthStrategy extends Strategy {
  readonly name = SUPABASE_AUTH;
  private supabase: SupabaseClient;
  private extractor: JwtFromRequestFunction;
  success: (user: any, info: any) => void;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  fail: Strategy["fail"]

  constructor(options: SupabaseAuthStrategyOptions) {
    super();
    if (!options.extractor) {
      throw new Error(
        "\n Extractor is not a function. You should provide an extractor. \n Read the docs: https://github.com/tfarras/nestjs-firebase-auth#readme"
      );
    }

    this.supabase = createClient(
      options.supabaseUrl,
      options.supabaseKey,
      (options.supabaseOptions = {})
    );
    this.extractor = options.extractor;
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    return payload;
  }

  authenticate(req: Request): void {
    const idToken = this.extractor(req);

    if (!idToken) {
      this.fail(UNAUTHORIZED, 401);
      return;
    }

    this.supabase.auth
      .getUser(idToken)
      .then((res) => this.validateSupabaseResponse(res))
      .catch((err) => {
        this.fail(err.message, 401);
      });
  }

  private async validateSupabaseResponse({ data }: any) {
    const result = await this.validate(data);
    if (result) {
      this.success(result, {});
      return;
    }
    this.fail(UNAUTHORIZED, 401);
    return;
  }
}
