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
      supabaseKey: process.env.SUPABASE_KEY,
      supabaseOptions: {},
      supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
      extractor: ExtractJwt.fromAuthHeaderAsBearerToken()
    });
  }

  async validate(payload: AuthUser | null): Promise<any> {
    return super.validate(payload);
  }

  authenticate(req) {
    return super.authenticate(req);
  }
}
