import { Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlayerScoreDto } from "./dto/submit-scores.dto";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import { Database } from "@fuzzy-waddle/api-interfaces";

@Injectable()
export class GameSessionService {
  private supabase: SupabaseClient<Database>;

  constructor(private readonly supabaseProvider: SupabaseProviderService) {
    this.supabase = this.supabaseProvider.supabaseClient;
  }

  /**
   * Create a new game session
   */
  async createSession(params: {
    gameInstanceId: string;
    gameType: string;
    mapId: string;
    createdByUserId: string;
    humanPlayerCount: number;
  }): Promise<void> {
    const { error } = await this.supabase.from("probable_waffle_game_sessions").insert({
      game_instance_id: params.gameInstanceId,
      game_type: params.gameType,
      map_id: params.mapId,
      created_by_user_id: params.createdByUserId,
      human_player_count: params.humanPlayerCount,
      session_state: "InProgress"
    });

    if (error) {
      console.error("Failed to create game session:", error);
      throw new Error(`Failed to create game session: ${error.message}`);
    }
  }

  /**
   * Update session state
   */
  async updateSessionState(gameInstanceId: string, sessionState: string): Promise<void> {
    const { error } = await this.supabase
      .from("probable_waffle_game_sessions")
      .update({ session_state: sessionState })
      .eq("game_instance_id", gameInstanceId);

    if (error) {
      console.error("Failed to update session state:", error);
      throw new Error(`Failed to update session state: ${error.message}`);
    }
  }

  /**
   * Get session by game instance ID
   */
  async getSession(gameInstanceId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("probable_waffle_game_sessions")
      .select("*")
      .eq("game_instance_id", gameInstanceId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Failed to get session:", error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if scores are already submitted
   */
  async checkScoresSubmitted(gameInstanceId: string): Promise<boolean> {
    const session = await this.getSession(gameInstanceId);
    return session?.scores_submitted === true;
  }

  /**
   * Submit player scores (idempotent)
   */
  async submitScores(
    gameInstanceId: string,
    playerScores: PlayerScoreDto[],
    submittedByUserId: string
  ): Promise<{ success: boolean; message: string }> {
    // Check if already submitted
    const alreadySubmitted = await this.checkScoresSubmitted(gameInstanceId);
    if (alreadySubmitted) {
      return {
        success: true,
        message: "Scores already recorded (idempotent)"
      };
    }

    // Get session ID
    const session = await this.getSession(gameInstanceId);
    if (!session) {
      throw new Error("Game session not found");
    }

    try {
      // Insert all player scores and metrics in a transaction-like manner
      for (const playerScore of playerScores) {
        // Insert player score core data
        const { data: insertedScore, error: scoreError } = await this.supabase
          .from("probable_waffle_player_scores")
          .insert({
            game_session_id: session.id,
            user_id: playerScore.userId || null,
            player_number: playerScore.playerNumber,
            player_name: playerScore.playerName,
            player_type: playerScore.playerType,
            team_number: playerScore.teamNumber || null,
            faction_type: playerScore.factionType,
            game_result: playerScore.gameResult,
            eliminated: playerScore.eliminated,
            eliminated_at: playerScore.eliminatedAt ? new Date(playerScore.eliminatedAt).toISOString() : null,
            final_score: playerScore.finalScore
          })
          .select("id")
          .single();

        if (scoreError) {
          console.error("Failed to insert player score:", scoreError);
          throw new Error(`Failed to insert player score: ${scoreError.message}`);
        }

        // Insert metrics for this player
        const playerScoreId = insertedScore.id;
        const metricInserts = [];

        for (const [metricKey, metricValue] of Object.entries(playerScore.metrics)) {
          if (metricValue > 0) {
            // Only insert non-zero metrics
            metricInserts.push({
              player_score_id: playerScoreId,
              metric_key: metricKey,
              metric_value: metricValue
            });
          }
        }

        if (metricInserts.length > 0) {
          // Get metric type IDs
          const { data: metricTypes, error: metricTypesError } = await this.supabase
            .from("probable_waffle_score_metric_types")
            .select("id, metric_key")
            .in(
              "metric_key",
              metricInserts.map((m) => m.metric_key)
            );

          if (metricTypesError) {
            console.error("Failed to get metric types:", metricTypesError);
            throw new Error(`Failed to get metric types: ${metricTypesError.message}`);
          }

          // Map metric keys to IDs
          const metricKeyToId = new Map(metricTypes.map((mt: any) => [mt.metric_key, mt.id]));

          // Insert metrics with type IDs
          const metricsToInsert = metricInserts
            .map((m) => ({
              player_score_id: playerScoreId,
              metric_type_id: metricKeyToId.get(m.metric_key),
              metric_value: m.metric_value
            }))
            .filter((m) => m.metric_type_id !== undefined);

          const { error: metricsError } = await this.supabase
            .from("probable_waffle_player_score_metrics")
            .insert(metricsToInsert);

          if (metricsError) {
            console.error("Failed to insert metrics:", metricsError);
            throw new Error(`Failed to insert metrics: ${metricsError.message}`);
          }
        }
      }

      // Calculate duration
      const startedAt = new Date(session.started_at);
      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

      // Mark session as complete
      const { error: updateError } = await this.supabase
        .from("probable_waffle_game_sessions")
        .update({
          scores_submitted: true,
          scores_submitted_by: submittedByUserId,
          scores_submitted_at: endedAt.toISOString(),
          session_state: "Completed",
          ended_at: endedAt.toISOString(),
          total_duration_seconds: durationSeconds
        })
        .eq("game_instance_id", gameInstanceId);

      if (updateError) {
        console.error("Failed to update session:", updateError);
        throw new Error(`Failed to update session: ${updateError.message}`);
      }

      // Refresh materialized view
      await this.refreshScoresView();

      return {
        success: true,
        message: "Scores recorded successfully"
      };
    } catch (error) {
      console.error("Error submitting scores:", error);
      throw error;
    }
  }

  /**
   * Refresh materialized view
   */
  async refreshScoresView(): Promise<void> {
    try {
      await this.supabase.rpc("refresh_probable_waffle_player_scores_full");
    } catch (error) {
      console.warn("Failed to refresh materialized view:", error);
      // Don't throw - view refresh is not critical
    }
  }

  /**
   * Get match history for a user
   */
  async getMatchHistory(userId: string, limit: number = 20, offset: number = 0): Promise<any> {
    const { data, error, count } = await this.supabase
      .from("probable_waffle_match_history")
      .select("*", { count: "exact" })
      .eq("user_participated", true)
      .order("ended_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Failed to get match history:", error);
      throw new Error(`Failed to get match history: ${error.message}`);
    }

    return {
      matches: data || [],
      total: count || 0,
      limit,
      offset
    };
  }

  /**
   * Get match details
   */
  async getMatchDetails(gameInstanceId: string, userId: string): Promise<any> {
    // Get session
    const session = await this.getSession(gameInstanceId);
    if (!session) {
      throw new Error("Game session not found");
    }

    // Verify user participated
    const { data: participation, error: participationError } = await this.supabase
      .from("probable_waffle_player_scores")
      .select("id")
      .eq("game_session_id", session.id)
      .eq("user_id", userId)
      .single();

    if (participationError || !participation) {
      throw new Error("User did not participate in this game");
    }

    // Get all player scores with metrics (use materialized view)
    const { data: playerScores, error: scoresError } = await this.supabase
      .from("probable_waffle_player_scores_full")
      .select("*")
      .eq("game_session_id", session.id)
      .order("final_score", { ascending: false });

    if (scoresError) {
      console.error("Failed to get player scores:", scoresError);
      throw new Error(`Failed to get player scores: ${scoresError.message}`);
    }

    return {
      gameSession: session,
      playerScores: playerScores || []
    };
  }
}
