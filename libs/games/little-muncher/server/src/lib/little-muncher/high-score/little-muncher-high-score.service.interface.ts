import { LittleMuncherScoreDto } from "@fuzzy-waddle/little-muncher-protocol";
import { User } from "@supabase/supabase-js";

export interface LittleMuncherHighScoreServiceInterface {
  postScore(body: LittleMuncherScoreDto, user: User): Promise<void>;
  getScores(): Promise<LittleMuncherScoreDto[]>;
}
