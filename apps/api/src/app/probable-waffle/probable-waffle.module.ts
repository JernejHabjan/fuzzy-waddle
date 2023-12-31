import { Module } from "@nestjs/common";
import { GameInstanceController } from "./game-instance/game-instance.controller";
import { GameInstanceService } from "./game-instance/game-instance.service";
import { GameStateServerService } from "./game-instance/game-state-server.service";
import { MatchmakingService } from "./game-instance/matchmaking/matchmaking.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { ProbableWaffleChatService } from "./game-instance/chat/probable-waffle-chat.service";
import { GameInstanceGateway } from "./game-instance/gateways/game-instance.gateway";
import { RoomGateway } from "./game-instance/gateways/room.gateway";

@Module({
  providers: [
    GameInstanceGateway,
    RoomGateway,
    GameInstanceService,
    GameStateServerService,
    MatchmakingService,
    TextSanitizationService,
    ProbableWaffleChatService
  ],
  controllers: [GameInstanceController]
})
export class ProbableWaffleModule {}
