import type { AuthUser } from "@supabase/supabase-js";
import type { GameChatAccessRegistry } from "@fuzzy-waddle/platform-chat/server/chat/game-chat-access-registry";
import type { GameInstanceService } from "../game-instance/game-instance.service";
import { ProbableWaffleGameChatAccessService } from "./probable-waffle-game-chat-access.service";

describe("ProbableWaffleGameChatAccessService", () => {
  it("registers the Probable Waffle room authorization check", () => {
    let registeredGuard: ((gameInstanceId: string, user: AuthUser) => void) | undefined;
    const accessRegistry = {
      register: jest.fn((guard) => {
        registeredGuard = guard;
      })
    } as Pick<GameChatAccessRegistry, "register">;
    const gameInstanceService = {
      ensureCanJoinGameRoom: jest.fn()
    } as Pick<GameInstanceService, "ensureCanJoinGameRoom">;
    const service = new ProbableWaffleGameChatAccessService(
      accessRegistry as GameChatAccessRegistry,
      gameInstanceService as GameInstanceService
    );
    const user = { id: "user-1" } as AuthUser;

    service.onModuleInit();
    registeredGuard?.("game-1", user);

    expect(accessRegistry.register).toHaveBeenCalledTimes(1);
    expect(gameInstanceService.ensureCanJoinGameRoom).toHaveBeenCalledWith("game-1", user);
  });
});
