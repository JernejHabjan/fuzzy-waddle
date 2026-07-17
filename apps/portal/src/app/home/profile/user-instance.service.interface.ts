export interface UserInstanceServiceInterface {
  getPreferredGame(): string | null;
  setVisitedGame(game: "aota" | "little-muncher" | "fly-squasher"): void;
}
