import { UserInstanceServiceInterface } from "./user-instance.service.interface";

export const userInstanceServiceStub = {
  setVisitedGame(game: "probable-waffle" | "little-muncher" | "fly-squasher") {},
  getPreferredGame(): string | null {
    return null;
  }
} satisfies UserInstanceServiceInterface;
