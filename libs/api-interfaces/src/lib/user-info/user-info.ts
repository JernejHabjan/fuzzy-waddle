import type { UserId } from "../game-instance/player/player";

export abstract class BaseUserInfo {
  constructor(public userId: UserId | null) {}
}
