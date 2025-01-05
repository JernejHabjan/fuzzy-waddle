import { Injectable } from "@nestjs/common";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import { ScoreDto } from "@fuzzy-waddle/api-interfaces";
import { User } from "../../users/users.service";

interface ScoreRecord {
  id: number;
  score: number;
  level: number;
  user_id: string;
  date: string;
  name: string;
}

@Injectable()
export class FlySquasherService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async postScore(body: ScoreDto, user: User): Promise<void> {
    const { error } = await this.supabaseProviderService.supabaseClient
      .from("fly_squasher_scores")
      .insert({ score: body.score, level: body.level, user_id: user.id });
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }
  }

  async getScores(): Promise<ScoreDto[]> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("fly_squasher_scores_with_user_meta")
      .select("*");
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }

    const recordData = data as ScoreRecord[];
    return recordData.map((item) => new ScoreDto(item.score, item.level, item.name, item.user_id, new Date(item.date)));
  }
}
