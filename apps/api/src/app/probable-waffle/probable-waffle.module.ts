import { Module } from "@nestjs/common";
import { GameInstanceController } from "./game-instance/game-instance.controller";
import { GameInstanceService } from "./game-instance/game-instance.service";
import { GameStateServerService } from "./game-instance/game-state-server.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { RoomController } from "./game-room/room.controller";
import { GameInstanceHolderService } from "./game-instance/game-instance-holder.service";
import { RoomGateway } from "./game-room/room.gateway";
import { GameInstanceGateway } from "./game-instance/game-instance.gateway";
import { MatchmakingService } from "./matchmaking/matchmaking.service";
import { ProbableWaffleChatService } from "./chat/probable-waffle-chat.service";
import { MatchmakingController } from "./matchmaking/matchmaking.controller";
import { RoomServerService } from "./game-room/room-server.service";

@Module({
  providers: [
    GameInstanceGateway,
    RoomGateway,
    GameInstanceHolderService,
    GameInstanceService,
    GameStateServerService,
    MatchmakingService,
    TextSanitizationService,
    ProbableWaffleChatService,
    RoomServerService
  ],
  controllers: [GameInstanceController, RoomController, MatchmakingController]
})
export class ProbableWaffleModule {}
