import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { AuthStrategies } from './auth-strategies';
import { SupabaseV2AuthStrategy } from './supabase-auth-strategy/supabase-v2-auth.strategy';
import { AuthUser } from '@supabase/supabase-js';
import { SupabaseAuthStrategyOptions } from './supabase-auth-strategy/options.interface';
import { UserAuthCacheService } from '../../core/cache/user-auth-cache.service.ts/user-auth-cache.service';
import { SupabaseProviderService } from '../../core/supabase-provider/supabase-provider.service';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(SupabaseV2AuthStrategy, AuthStrategies.supabase) {
  constructor(userAuthCacheService: UserAuthCacheService, supabaseProviderService: SupabaseProviderService) {
    super({
      supabaseClient: supabaseProviderService.supabaseClient,
      extractor: (req) => {
        // for socket-io extract token from handshake
        const accessToken = (req as any)?.handshake?.auth?.token || (req as any)?.handshake?.query?.access_token;
        if (accessToken) {
          return accessToken;
        }

        // extract from fromAuthHeaderAsBearerToken
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      userAuthCacheService
    } as SupabaseAuthStrategyOptions);
  }

  async validate(payload: AuthUser | null): Promise<any> {
    return super.validate(payload);
  }

  authenticate(req) {
    return super.authenticate(req);
  }
}
