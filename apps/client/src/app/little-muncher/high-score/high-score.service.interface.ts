import { LittleMuncherHillEnum, LittleMuncherScoreDto } from "@fuzzy-waddle/api-interfaces";

export interface HighScoreServiceInterface {
  postScore(score: number, hill: LittleMuncherHillEnum): Promise<void>;
  getScores(): Promise<LittleMuncherScoreDto[]>;
}
