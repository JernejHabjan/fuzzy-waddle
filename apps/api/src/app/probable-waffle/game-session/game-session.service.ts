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
   * Creates a new game session row.
   * Called on-the-fly during score submission when no prior session exists
   * (e.g. skirmish games that were never tracked via matchmaking).
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
   * Fetches a game session by its game_instance_id.
   * Returns null when not found (no error thrown for missing rows).
   */
  async getSession(
    gameInstanceId: string
  ): Promise<Database["public"]["Tables"]["probable_waffle_game_sessions"]["Row"] | null> {
    const { data, error } = await this.supabase
      .from("probable_waffle_game_sessions")
      .select("*")
      .eq("game_instance_id", gameInstanceId)
      .maybeSingle();

    if (error) {
      console.error("Failed to get session:", error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data;
  }

  /**
   * Returns true if scores have already been recorded for this game instance.
   * Used to make score submission idempotent.
   */
  async checkScoresSubmitted(gameInstanceId: string): Promise<boolean> {
    const session = await this.getSession(gameInstanceId);
    return session?.scores_submitted === true;
  }

  /**
   * Records player scores and timeline snapshots for a completed game.
   *
   * Idempotent: calling this more than once for the same game instance is safe —
   * the second call returns early without inserting duplicates.
   *
   * If no prior session row exists (e.g. offline skirmish), one is created
   * on-the-fly using the provided `sessionMeta`. `sessionMeta.mapId` is required
   * in that case.
   *
   * On any insertion failure the method returns `{ success: false }` rather than
   * throwing, so the HTTP response always has a 2xx status and the caller can
   * inspect the message.
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
      return { success: true, message: "Scores already recorded (idempotent)" };
    }

    // Resolve session row, creating one on-the-fly when missing
    let session = await this.getSession(gameInstanceId);
    if (!session) {
      if (!sessionMeta?.mapId) {
        return { success: false, message: "Game session not found and insufficient data to create one" };
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
        return { success: false, message: "Failed to retrieve game session after creation" };
      }
    }

    try {
      // Insert all player scores and their metrics
      for (const playerScore of playerScores) {
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
          return { success: false, message: `Failed to insert player score: ${scoreError.message}` };
        }

        const playerScoreId = insertedScore.id;
        const metricInserts = Object.entries(playerScore.metrics)
          .filter(([, value]) => value > 0) // Only persist non-zero metrics
          .map(([metric_key, metric_value]) => ({ player_score_id: playerScoreId, metric_key, metric_value }));

        if (metricInserts.length > 0) {
          // Resolve metric_key → metric_type_id from the catalog table
          const { data: metricTypes, error: metricTypesError } = await this.supabase
            .from("probable_waffle_score_metric_types")
            .select("id, metric_key")
            .in(
              "metric_key",
              metricInserts.map((m) => m.metric_key)
            );

          if (metricTypesError) {
            console.error("Failed to get metric types:", metricTypesError);
            return { success: false, message: `Failed to get metric types: ${metricTypesError.message}` };
          }

          const metricKeyToId = new Map(metricTypes.map((mt) => [mt.metric_key, mt.id]));

          const metricsToInsert = metricInserts
            .map((m) => ({
              player_score_id: playerScoreId,
              metric_type_id: metricKeyToId.get(m.metric_key),
              metric_value: m.metric_value
            }))
            .filter((m): m is { player_score_id: number; metric_type_id: number; metric_value: number } =>
              m.metric_type_id !== undefined
            );

          const { error: metricsError } = await this.supabase
            .from("probable_waffle_player_score_metrics")
            .insert(metricsToInsert);

          if (metricsError) {
            console.error("Failed to insert metrics:", metricsError);
            return { success: false, message: `Failed to insert metrics: ${metricsError.message}` };
          }
        }
      }

      // Store all timeline snapshots as a single JSONB row
      if (snapshots && snapshots.length > 0) {
        const { error: snapshotError } = await this.supabase.from("probable_waffle_score_snapshots").insert({
          game_session_id: session.id,
          snapshots: snapshots as unknown as Json
        });
        if (snapshotError) {
          console.warn("Failed to insert snapshots (non-critical):", snapshotError);
        }
      }

      // Calculate session duration and mark as complete
      const startedAt = new Date(session.started_at);
      const endedAt = new Date();
      const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

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
        return { success: false, message: `Failed to update session: ${updateError.message}` };
      }

      // Refresh materialized view (best-effort)
      await this.refreshScoresView();

      return { success: true, message: "Scores recorded successfully" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error during score submission";
      console.error("Error submitting scores:", error);
      return { success: false, message };
    }
  }

  /**
   * Refreshes the `probable_waffle_player_scores_full` materialized view.
   * Failures are non-fatal — the view will be stale until the next refresh.
   */
  async refreshScoresView(): Promise<void> {
    try {
      await this.supabase.rpc("refresh_probable_waffle_player_scores_full");
    } catch (error) {
      console.warn("Failed to refresh materialized view:", error);
    }
  }

  /**
   * Returns paginated match history for a given user.
   * Only sessions the user participated in (has a player_score row) are returned.
   * Sessions without an ended_at are excluded (still in-progress).
   */
  async getMatchHistory(userId: string, limit: number = 20, offset: number = 0): Promise<unknown> {
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
    const pageSessionIds = sessions.map((s) => s.id);
    const { data: allPlayers, error: playersError } = await this.supabase
      .from("probable_waffle_player_scores")
      .select("game_session_id, player_number, player_name, faction_type, game_result, final_score, user_id")
      .in("game_session_id", pageSessionIds);

    if (playersError) {
      console.error("Failed to get players:", playersError);
      throw new Error(`Failed to get players: ${playersError.message}`);
    }

    const playersBySession = new Map<string, typeof allPlayers>();
    for (const p of allPlayers ?? []) {
      const list = playersBySession.get(p.game_session_id) ?? [];
      list.push(p);
      playersBySession.set(p.game_session_id, list);
    }

    const matches = sessions.map((session) => ({
      id: session.id,
      gameInstanceId: session.game_instance_id,
      gameType: session.game_type,
      mapId: session.map_id,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalDurationSeconds: session.total_duration_seconds,
      humanPlayerCount: session.human_player_count,
      userResult: userResultMap.get(session.id) ?? "quit",
      players: (playersBySession.get(session.id) ?? []).map((ps) => ({
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
   * Returns full score details for a single match.
   *
   * Access control: verifies the requesting user has a player_score row for
   * this session before returning any data.
   *
   * Includes per-player metrics (joined from the metric catalog) and the
   * full timeline snapshot array for the score-over-time chart.
   */
  async getMatchDetails(gameInstanceId: string, userId: string): Promise<unknown> {
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
      .maybeSingle();

    if (participationError || !participation) {
      throw new Error("User did not participate in this game");
    }

    // Fetch all player score rows for this session
    const { data: scores, error: scoresError } = await this.supabase
      .from("probable_waffle_player_scores")
      .select("*")
      .eq("game_session_id", session.id)
      .order("final_score", { ascending: false });

    if (scoresError) {
      console.error("Failed to get player scores:", scoresError);
      throw new Error(`Failed to get player scores: ${scoresError.message}`);
    }

    // Fetch metrics for all players in a single query via FK join
    const scoreIds = (scores ?? []).map((s) => s.id);
    const metricsMap = new Map<number, Record<string, number>>();

    if (scoreIds.length > 0) {
      const { data: metrics } = await this.supabase
        .from("probable_waffle_player_score_metrics")
        .select("player_score_id, metric_value, probable_waffle_score_metric_types(metric_key)")
        .in("player_score_id", scoreIds);

      for (const m of metrics ?? []) {
        const key = (m.probable_waffle_score_metric_types as { metric_key: string } | null)?.metric_key;
        if (!key) continue;
        const existing = metricsMap.get(m.player_score_id) ?? {};
        existing[key] = m.metric_value;
        metricsMap.set(m.player_score_id, existing);
      }
    }

    const playerScores = (scores ?? []).map((s) => ({
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

    // Fetch the single timeline-snapshots row for this session
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
