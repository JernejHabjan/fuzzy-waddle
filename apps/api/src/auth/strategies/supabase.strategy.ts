import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { AuthStrategies } from './auth-strategies';
import { SupabaseV2AuthStrategy } from './supabase-auth-strategy/supabase-v2-auth.strategy';
import { AuthUser } from '@supabase/supabase-js';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(SupabaseV2AuthStrategy, AuthStrategies.supabase) {
  constructor() {
    super({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_KEY,
      supabaseOptions: {},
      extractor: (req) => {
        // for socket-io extract token from handshake
        const accessToken = req?.handshake?.auth?.token || req?.handshake?.query?.access_token;
        if (accessToken) {
          return accessToken;
        }
        // extract from fromAuthHeaderAsBearerToken
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      }
    });
  }

  async validate(payload: AuthUser | null): Promise<any> {
    return super.validate(payload);
  }

  authenticate(req) {
    return super.authenticate(req);
  }
}
