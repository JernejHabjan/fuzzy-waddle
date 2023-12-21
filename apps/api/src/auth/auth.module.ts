import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { SupabaseStrategy } from "./strategies/supabase.strategy";
import { UsersModule } from "../users/users.module";
import { jwtConstants } from "./constants";
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { LocalStrategy } from './strategies/local.strategy';
import { ScheduleModule } from "@nestjs/schedule";
import { JwtModule } from "@nestjs/jwt";
import { UserAuthCacheService } from "../core/cache/user-auth-cache.service.ts/user-auth-cache.service";
import { SupabaseProviderService } from "../core/supabase-provider/supabase-provider.service";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: "60s" }
    }),
    ScheduleModule.forRoot()
  ],
  providers: [
    AuthService,
    /*LocalStrategy, JwtStrategy,*/ SupabaseStrategy,
    UserAuthCacheService,
    SupabaseProviderService
  ],
  exports: [AuthService, SupabaseStrategy]
})
export class AuthModule {}
