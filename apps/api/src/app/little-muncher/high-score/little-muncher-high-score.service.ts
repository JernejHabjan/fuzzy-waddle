import { Injectable } from "@nestjs/common";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import { LittleMuncherScoreDto } from "@fuzzy-waddle/api-interfaces";
import { type LittleMuncherHighScoreServiceInterface } from "./little-muncher-high-score.service.interface";
import { User } from "@supabase/supabase-js";

interface ScoreRecord {
  id: number;
  score: number;
  hill: number;
  user_id: string;
  user_name: string;
  date: string;
}

@Injectable()
export class LittleMuncherHighScoreService implements LittleMuncherHighScoreServiceInterface {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async postScore(body: LittleMuncherScoreDto, user: User): Promise<void> {
    const { error } = await this.supabaseProviderService.supabaseClient
      .from("little_muncher_scores")
      .insert({ score: body.score, hill: body.hill, user_id: user.id });
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  async getScores(): Promise<LittleMuncherScoreDto[]> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("little_muncher_scores_with_user_meta")
      .select("*");
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }

    const recordData = data as ScoreRecord[];
    return recordData.map(
      (item) => new LittleMuncherScoreDto(item.score, item.hill, item.user_id, item.user_name, new Date(item.date))
    );
  }
}
