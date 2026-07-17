import type { UserId } from "./player/player";

export abstract class BaseUserInfo {
  constructor(public userId: UserId | null) {}
}
