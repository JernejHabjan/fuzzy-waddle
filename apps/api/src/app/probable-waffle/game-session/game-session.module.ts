import { Module } from "@nestjs/common";
import { GameSessionController } from "./game-session.controller";
import { GameSessionService } from "./game-session.service";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";

@Module({
  controllers: [GameSessionController],
  providers: [GameSessionService, SupabaseProviderService],
  exports: [GameSessionService]
})
export class GameSessionModule {}
