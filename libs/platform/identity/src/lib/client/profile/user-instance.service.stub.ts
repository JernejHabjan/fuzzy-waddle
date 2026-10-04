import { type UserInstanceServiceInterface } from "./user-instance.service.interface";

export const userInstanceServiceStub = {
  setVisitedGame(game: "aota" | "little-muncher" | "fly-squasher") {},
  getPreferredGame(): string | null {
    return null;
  }
} satisfies UserInstanceServiceInterface;
