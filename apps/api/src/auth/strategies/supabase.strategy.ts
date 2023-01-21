import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { AuthStrategies } from './auth-strategies';
import { SupabaseV2AuthStrategy } from './supabase-auth-strategy/supabase-v2-auth.strategy';

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

  async validate(payload: any): Promise<any> {
    console.log('in validate');
    return super.validate(payload);
  }

  authenticate(req) {
    console.log('in authenticate');
    return super.authenticate(req);
  }
}
