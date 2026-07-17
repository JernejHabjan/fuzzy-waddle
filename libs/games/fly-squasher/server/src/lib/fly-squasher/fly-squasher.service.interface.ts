import { ScoreDto } from "@fuzzy-waddle/fly-squasher-protocol";
import { User } from "@supabase/supabase-js";

export interface FlySquasherServiceInterface {
  postScore(body: ScoreDto, user: User): Promise<void>;
  getScores(): Promise<ScoreDto[]>;
}
