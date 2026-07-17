import { FlySquasherLevelEnum, ScoreDto } from "@fuzzy-waddle/api-interfaces";

export interface HighScoreServiceInterface {
  postScore(score: number, level: FlySquasherLevelEnum): Promise<void>;
  getScores(): Promise<ScoreDto[]>;
}
