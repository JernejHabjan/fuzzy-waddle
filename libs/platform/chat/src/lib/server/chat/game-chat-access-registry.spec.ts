import { ForbiddenException } from "@nestjs/common";
import type { AuthUser } from "@supabase/supabase-js";
import { GameChatAccessRegistry } from "./game-chat-access-registry";

describe("GameChatAccessRegistry", () => {
  const user = { id: "user-1" } as AuthUser;

  it("denies access until a game registers its authorization guard", () => {
    const registry = new GameChatAccessRegistry();

    expect(() => registry.ensureCanAccess("game-1", user)).toThrow(ForbiddenException);
  });

  it("delegates access checks to the registered game guard", () => {
    const registry = new GameChatAccessRegistry();
    const guard = jest.fn();
    registry.register(guard);

    registry.ensureCanAccess("game-1", user);

    expect(guard).toHaveBeenCalledWith("game-1", user);
  });
});
