import { LittleMuncherScoreDto } from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface LittleMuncherHighScoreServiceInterface {
  postScore(body: LittleMuncherScoreDto, user: User): Promise<void>;
  getScores(): Promise<LittleMuncherScoreDto[]>;
}
