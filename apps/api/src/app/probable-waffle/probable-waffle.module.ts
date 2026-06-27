import { forwardRef, Module } from "@nestjs/common";
import { GameInstanceController } from "./game-instance/game-instance.controller";
import { GameInstanceService } from "./game-instance/game-instance.service";
import { GameStateServerService } from "./game-instance/game-state-server.service";
import { GameCommandValidatorService } from "./game-instance/multiplayer/game-command-validator.service";
import { TextSanitizationService } from "../../core/content-filters/text-sanitization.service";
import { RoomController } from "./game-room/room.controller";
import { GameInstanceHolderService } from "./game-instance/game-instance-holder.service";
import { RoomGateway } from "./game-room/room.gateway";
import { GameInstanceGateway } from "./game-instance/game-instance.gateway";
import { MatchmakingService } from "./matchmaking/matchmaking.service";
import { ProbableWaffleChatService } from "./chat/probable-waffle-chat.service";
import { MatchmakingController } from "./matchmaking/matchmaking.controller";
import { RoomServerService } from "./game-room/room-server.service";
import { ChatModule } from "../chat/chat.module";
import { GameSessionModule } from "./game-session/game-session.module";
import { AuthModule } from "../../auth/auth.module";
import { PlayerDisconnectTrackerService } from "./game-instance/multiplayer/player-disconnect-tracker.service";
import { PauseStateValidatorService } from "./game-instance/multiplayer/pause-state-validator.service";
import { PlayerStateValidatorService } from "./game-instance/multiplayer/player-state-validator.service";

@Module({
  imports: [AuthModule, forwardRef(() => ChatModule), GameSessionModule],
  providers: [
    GameInstanceGateway,
    RoomGateway,
    GameInstanceHolderService,
    GameInstanceService,
    GameStateServerService,
    GameCommandValidatorService,
    PauseStateValidatorService,
    PlayerStateValidatorService,
    MatchmakingService,
    TextSanitizationService,
    ProbableWaffleChatService,
    RoomServerService,
    PlayerDisconnectTrackerService
  ],
  exports: [GameInstanceService],
  controllers: [GameInstanceController, RoomController, MatchmakingController]
})
export class ProbableWaffleModule {}
