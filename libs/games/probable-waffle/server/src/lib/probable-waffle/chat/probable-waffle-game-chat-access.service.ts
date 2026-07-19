import { Injectable, type OnModuleInit } from "@nestjs/common";
import { GameChatAccessRegistry } from "@fuzzy-waddle/platform-chat/server/chat/game-chat-access-registry";
import { GameInstanceService } from "../game-instance/game-instance.service";

@Injectable()
export class ProbableWaffleGameChatAccessService implements OnModuleInit {
  constructor(
    private readonly accessRegistry: GameChatAccessRegistry,
    private readonly gameInstanceService: GameInstanceService
  ) {}

  onModuleInit(): void {
    this.accessRegistry.register((gameInstanceId, user) => {
      this.gameInstanceService.ensureCanJoinGameRoom(gameInstanceId, user);
    });
  }
}
