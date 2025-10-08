import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { SupabaseStrategy } from "./strategies/supabase.strategy";
import { jwtConstants } from "./constants";
import { ScheduleModule } from "@nestjs/schedule";
import { JwtModule } from "@nestjs/jwt";
import { UserAuthCacheService } from "../core/cache/user-auth-cache.service.ts/user-auth-cache.service";
import { SupabaseProviderService } from "../core/supabase-provider/supabase-provider.service";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "60s" }
    }),
    ScheduleModule.forRoot()
  ],
  providers: [SupabaseStrategy, UserAuthCacheService, SupabaseProviderService],
  exports: [SupabaseStrategy]
})
export class AuthModule {}
