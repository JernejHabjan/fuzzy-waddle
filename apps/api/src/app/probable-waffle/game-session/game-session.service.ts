import { Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import {
  Database,
  type GameScoreSnapshotDto,
  type Json,
  PlayerScoreDto,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/api-interfaces";

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
    mapId: ProbableWaffleMapEnum;
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
    submittedByUserId: string,
    sessionMeta?: { gameType?: string; mapId?: number; humanPlayerCount?: number },
    snapshots?: GameScoreSnapshotDto[]
  ): Promise<{ success: boolean; message: string }> {
    // Check if already submitted
    const alreadySubmitted = await this.checkScoresSubmitted(gameInstanceId);
    if (alreadySubmitted) {
      return {
        success: true,
        message: "Scores already recorded (idempotent)"
      };
    }

    // Get session ID, or create one on-the-fly for games not tracked via matchmaking
    let session = await this.getSession(gameInstanceId);
    if (!session) {
      if (!sessionMeta?.mapId) {
        throw new Error("Game session not found and insufficient data to create one");
      }
      await this.createSession({
        gameInstanceId,
        gameType: sessionMeta.gameType ?? "Skirmish",
        mapId: sessionMeta.mapId as ProbableWaffleMapEnum,
        createdByUserId: submittedByUserId,
        humanPlayerCount: sessionMeta.humanPlayerCount ?? 1
      });
      session = await this.getSession(gameInstanceId);
      if (!session) {
        throw new Error("Failed to create game session");
      }
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

      // Store score snapshots for timeline charts (single row per game)
      if (snapshots && snapshots.length > 0) {
        const { error: snapshotError } = await this.supabase
          .from("probable_waffle_score_snapshots")
          .insert({
            game_session_id: session.id,
            snapshots: snapshots as unknown as Json
          });
        if (snapshotError) {
          console.warn("Failed to insert snapshots (non-critical):", snapshotError);
        }
      }

      // Calculate duration
      const startedAt = new Date(session.started_at);
      const endedAt = new Date();
      const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

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
    // Step 1: find all session IDs this user participated in
    const { data: participations, error: partError } = await this.supabase
      .from("probable_waffle_player_scores")
      .select("game_session_id, game_result")
      .eq("user_id", userId);

    if (partError) {
      console.error("Failed to get match history:", partError);
      throw new Error(`Failed to get match history: ${partError.message}`);
    }

    if (!participations || participations.length === 0) {
      return { matches: [], total: 0, limit, offset };
    }

    const sessionIds = participations.map((p) => p.game_session_id);
    const userResultMap = new Map(participations.map((p) => [p.game_session_id, p.game_result]));

    // Step 2: get paginated sessions
    const {
      data: sessions,
      error: sessError,
      count
    } = await this.supabase
      .from("probable_waffle_game_sessions")
      .select(
        "id, game_instance_id, game_type, map_id, started_at, ended_at, total_duration_seconds, human_player_count",
        { count: "exact" }
      )
      .in("id", sessionIds)
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessError) {
      console.error("Failed to get match history:", sessError);
      throw new Error(`Failed to get match history: ${sessError.message}`);
    }

    if (!sessions || sessions.length === 0) {
      return { matches: [], total: count ?? 0, limit, offset };
    }

    // Step 3: get all players for the returned sessions
    const pageSessionIds = sessions.map((s: any) => s.id);
    const { data: allPlayers, error: playersError } = await this.supabase
      .from("probable_waffle_player_scores")
      .select("game_session_id, player_number, player_name, faction_type, game_result, final_score, user_id")
      .in("game_session_id", pageSessionIds);

    if (playersError) {
      console.error("Failed to get players:", playersError);
      throw new Error(`Failed to get players: ${playersError.message}`);
    }

    const playersBySession = new Map<string, any[]>();
    for (const p of allPlayers ?? []) {
      const list = playersBySession.get(p.game_session_id) ?? [];
      list.push(p);
      playersBySession.set(p.game_session_id, list);
    }

    const matches = sessions.map((session: any) => ({
      id: session.id,
      gameInstanceId: session.game_instance_id,
      gameType: session.game_type,
      mapId: session.map_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalDurationSeconds: session.total_duration_seconds,
      humanPlayerCount: session.human_player_count,
      userResult: userResultMap.get(session.id) ?? "quit",
      players: (playersBySession.get(session.id) ?? []).map((ps: any) => ({
        playerNumber: ps.player_number,
        playerName: ps.player_name,
        factionType: ps.faction_type,
        gameResult: ps.game_result,
        finalScore: ps.final_score,
        isCurrentUser: ps.user_id === userId
      }))
    }));

    return { matches, total: count ?? 0, limit, offset };
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

    // Get all player scores for this session from base table
    const { data: scores, error: scoresError } = await this.supabase
      .from("probable_waffle_player_scores")
      .select("*")
      .eq("game_session_id", session.id)
      .order("final_score", { ascending: false });

    if (scoresError) {
      console.error("Failed to get player scores:", scoresError);
      throw new Error(`Failed to get player scores: ${scoresError.message}`);
    }

    // Get metrics for all players in one query (FK relationship exists)
    const scoreIds = (scores ?? []).map((s: any) => s.id);
    const metricsMap = new Map<number, Record<string, number>>();

    if (scoreIds.length > 0) {
      const { data: metrics } = await this.supabase
        .from("probable_waffle_player_score_metrics")
        .select("player_score_id, metric_value, probable_waffle_score_metric_types(metric_key)")
        .in("player_score_id", scoreIds);

      for (const m of metrics ?? []) {
        const key = (m.probable_waffle_score_metric_types as any)?.metric_key;
        if (!key) continue;
        const existing = metricsMap.get(m.player_score_id) ?? {};
        existing[key] = m.metric_value;
        metricsMap.set(m.player_score_id, existing);
      }
    }

    const playerScores = (scores ?? []).map((s: any) => ({
      playerNumber: s.player_number,
      playerName: s.player_name,
      playerType: s.player_type,
      teamNumber: s.team_number ?? undefined,
      factionType: s.faction_type,
      gameResult: s.game_result,
      eliminated: s.eliminated,
      eliminatedAt: s.eliminated_at ? new Date(s.eliminated_at).getTime() : undefined,
      finalScore: s.final_score,
      metrics: metricsMap.get(s.id) ?? {},
      userId: s.user_id ?? undefined
    }));

    const startedAt = new Date(session.started_at);
    const endedAt = session.ended_at ? new Date(session.ended_at) : new Date();
    const calculatedDuration = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

    // Retrieve snapshots for timeline chart (single row per game)
    const { data: snapshotRow } = await this.supabase
      .from("probable_waffle_score_snapshots")
      .select("snapshots")
      .eq("game_session_id", session.id)
      .maybeSingle();

    const snapshots: GameScoreSnapshotDto[] = snapshotRow
      ? (snapshotRow.snapshots as unknown as GameScoreSnapshotDto[])
      : [];

    return {
      gameSession: {
        id: session.id,
        gameInstanceId: session.game_instance_id,
        gameType: session.game_type,
        mapId: session.map_id,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        totalDurationSeconds:
          session.total_duration_seconds != null && session.total_duration_seconds >= 0
            ? session.total_duration_seconds
            : calculatedDuration,
        humanPlayerCount: session.human_player_count
      },
      playerScores,
      snapshots
    };
  }
}
