import { Injectable } from "@nestjs/common";
import { SupabaseProviderService } from "../../core/supabase-provider/supabase-provider.service";
import {
  GameKey,
  GameParticipantType,
  GameResultStatus,
  GameSessionStatus,
  ScoreDto
} from "@fuzzy-waddle/api-interfaces";
import { type FlySquasherServiceInterface } from "./fly-squasher.service.interface";
import { User } from "@supabase/supabase-js";

interface ScoreRecord {
  id: number;
  score: number;
  level: number;
  user_id: string;
  date: string;
  name: string;
}

@Injectable()
export class FlySquasherService implements FlySquasherServiceInterface {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async postScore(body: ScoreDto, user: User): Promise<void> {
    const supabase = this.supabaseProviderService.supabaseClient;
    const rankingScopeKey = body.level.toString();

    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .insert({
        game_key: GameKey.FlySquasher,
        level_key: rankingScopeKey,
        session_status: GameSessionStatus.Completed,
        created_by_user_id: user.id,
        completed_by_user_id: user.id,
        completed_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        human_player_count: 1
      })
      .select("id")
      .single();
    if (sessionError) {
      console.error(sessionError);
      return Promise.reject(sessionError);
    }

    const { data: participant, error: participantError } = await supabase
      .from("game_session_participants")
      .insert({
        game_session_id: session.id,
        user_id: user.id,
        participant_number: 1,
        display_name: body.userName || user.email || "Player",
        participant_type: GameParticipantType.Human,
        result_status: GameResultStatus.Win
      })
      .select("id")
      .single();
    if (participantError) {
      console.error(participantError);
      return Promise.reject(participantError);
    }

    const { error: scoreError } = await supabase.from("game_score_records").insert({
      game_session_id: session.id,
      participant_id: participant.id,
      user_id: user.id,
      game_key: GameKey.FlySquasher,
      score_value: body.score,
      ranking_scope_key: rankingScopeKey,
      submitted_by_user_id: user.id,
      metadata: { level: body.level }
    });
    if (scoreError) {
      console.error(scoreError);
      return Promise.reject(scoreError);
    }
  }

  async getScores(): Promise<ScoreDto[]> {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("fly_squasher_leaderboard")
      .select("*");
    if (error) {
      console.error(error);
      return Promise.reject(error);
    }

    const recordData = data as ScoreRecord[];
    return recordData.map((item) => new ScoreDto(item.score, item.level, item.name, item.user_id, new Date(item.date)));
  }
}
