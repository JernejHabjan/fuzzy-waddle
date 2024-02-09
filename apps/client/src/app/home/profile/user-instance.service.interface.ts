export interface UserInstanceServiceInterface {
  getPreferredGame(): string | null;
  setVisitedGame(game: "probable-waffle" | "little-muncher" | "fly-squasher"): void;
}
