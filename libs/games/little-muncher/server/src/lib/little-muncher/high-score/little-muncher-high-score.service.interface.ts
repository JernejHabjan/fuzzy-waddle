import { LittleMuncherScoreDto } from "@fuzzy-waddle/little-muncher-protocol";
import type { User } from "@supabase/supabase-js";

export interface LittleMuncherHighScoreServiceInterface {
  postScore(body: LittleMuncherScoreDto, user: User): Promise<void>;
  getScores(): Promise<LittleMuncherScoreDto[]>;
}
