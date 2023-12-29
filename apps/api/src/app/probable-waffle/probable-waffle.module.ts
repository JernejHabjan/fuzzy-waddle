import { Module } from "@nestjs/common";
import { GameInstanceController } from "./game-instance/game-instance.controller";
import { GameInstanceService } from "./game-instance/game-instance.service";
import { GameInstanceGateway } from "./game-instance/game-instance.gateway";
import { GameStateServerService } from "./game-instance/game-state-server.service";
import { GameStateGateway } from "./game-instance/game-state.gateway";
import { MatchmakingService } from "./game-instance/matchmaking/matchmaking.service";

@Module({
  providers: [GameInstanceGateway, GameStateGateway, GameInstanceService, GameStateServerService, MatchmakingService],
  controllers: [GameInstanceController]
})
export class ProbableWaffleModule {}
