import { LittleMuncherHillEnum, LittleMuncherScoreDto } from "@fuzzy-waddle/little-muncher-protocol";

export interface HighScoreServiceInterface {
  postScore(score: number, hill: LittleMuncherHillEnum): Promise<void>;
  getScores(): Promise<LittleMuncherScoreDto[]>;
}
