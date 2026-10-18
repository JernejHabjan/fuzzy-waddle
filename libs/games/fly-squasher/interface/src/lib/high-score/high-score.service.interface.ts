import { FlySquasherLevelEnum, ScoreDto } from "@fuzzy-waddle/fly-squasher-protocol";

export interface HighScoreServiceInterface {
  postScore(score: number, level: FlySquasherLevelEnum): Promise<void>;
  getScores(): Promise<ScoreDto[]>;
}
