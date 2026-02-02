import { Module } from "@nestjs/common";
import { GameInstanceController } from "./game-instance/game-instance.controller";
import { GameInstanceService } from "./game-instance/game-instance.service";
import { GameInstanceGateway } from "./game-instance/game-instance.gateway";
import { GameStateServerService } from "./game-instance/game-state-server.service";
import { GameStateGateway } from "./game-instance/game-state.gateway";
import { LittleMuncherHighScoreService } from "./high-score/little-muncher-high-score.service";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";

@Module({
  providers: [
    GameInstanceGateway,
    GameStateGateway,
    SupabaseProviderService,
    GameInstanceService,
    GameStateServerService,
    LittleMuncherHighScoreService
  ],
  controllers: [GameInstanceController]
})
export class LittleMuncherModule {}
