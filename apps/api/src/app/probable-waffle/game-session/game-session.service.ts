import { Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import {
  type Database,
  GameKey,
  GameParticipantType,
  GameResultStatus,
  type GameScoreSnapshotDto,
  GameSessionStatus,
  type Json,
  PlayerScoreDto,
  ProbableWaffleMapEnum
} from "@fuzzy-waddle/api-interfaces";
import { GameSessionServiceInterface } from "./game-session.service.interface";

type GameSessionRow = Database["public"]["Tables"]["game_sessions"]["Row"];

@Injectable()
export class GameSessionService implements GameSessionServiceInterface {
  private supabase: SupabaseClient<Database>;

  constructor(private readonly supabaseProvider: SupabaseProviderService) {
    this.supabase = this.supabaseProvider.supabaseClient;
  }

  /**
   * Creates a generic game session row for Probable Waffle.
   * Called on-the-fly during score submission when no prior session exists.
   */
  async createSession(params: {
    gameInstanceId: string;
    gameType: string;
    mapId: ProbableWaffleMapEnum;
    createdByUserId: string;
    humanPlayerCount: number;
  }): Promise<void> {
    const existing = await this.getSession(params.gameInstanceId);
    if (existing) return;

    const { error } = await this.supabase.from("game_sessions").insert({
      external_session_id: params.gameInstanceId,
      game_key: GameKey.ProbableWaffle,
      game_mode_key: params.gameType,
      map_key: params.mapId.toString(),
      session_status: GameSessionStatus.InProgress,
      created_by_user_id: params.createdByUserId,
      human_player_count: params.humanPlayerCount
    });

    if (error) {
      console.error("Failed to create game session:", error);
      throw new Error(`Failed to create game session: ${error.message}`);
    }
  }

  /**
   * Fetches a game session by the client/game instance UUID.
   */
  async getSession(gameInstanceId: string): Promise<GameSessionRow | null> {
    const { data, error } = await this.supabase
      .from("game_sessions")
      .select("*")
      .eq("external_session_id", gameInstanceId)
      .maybeSingle();

    if (error) {
      console.error("Failed to get session:", error);
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return data;
  }

  /**
   * Returns true if scores have already been recorded for this game instance.
   */
  async checkScoresSubmitted(gameInstanceId: string): Promise<boolean> {
    const session = await this.getSession(gameInstanceId);
    return session?.session_status === GameSessionStatus.Completed && session.completed_at != null;
  }

  /**
   * Records player scores and timeline snapshots for a completed game.
   * Idempotent: repeated calls for the same game instance return success.
   */
  async submitScores(
    gameInstanceId: string,
    playerScores: PlayerScoreDto[],
    submittedByUserId: string,
    sessionMeta?: { gameType?: string; mapId?: number; humanPlayerCount?: number },
    snapshots?: GameScoreSnapshotDto[]
  ): Promise<{ success: boolean; message: string }> {
    const alreadySubmitted = await this.checkScoresSubmitted(gameInstanceId);
    if (alreadySubmitted) {
      return { success: true, message: "Scores already recorded (idempotent)" };
    }

    let session = await this.getSession(gameInstanceId);
    if (!session) {
      if (!sessionMeta?.mapId) {
        return { success: false, message: "Game session not found and insufficient data to create one" };
      }

      await this.createSession({
        gameInstanceId,
        gameType: sessionMeta.gameType ?? "Skirmish",
        mapId: sessionMeta.mapId ,
        createdByUserId: submittedByUserId,
        humanPlayerCount: sessionMeta.humanPlayerCount ?? 1
      });
      session = await this.getSession(gameInstanceId);
      if (!session) {
        return { success: false, message: "Failed to retrieve game session after creation" };
      }
    }

    try {
      // Retries must start from a clean slate because a previous partial write
      // leaves the session "in_progress" but can already contain participants/scores.
      await this.clearIncompleteSessionData(session.id);

      const metricKeyToId = await this.getMetricDefinitionIds(playerScores);

      for (const playerScore of playerScores) {
        const { data: participant, error: participantError } = await this.supabase
          .from("game_session_participants")
          .insert({
            game_session_id: session.id,
            user_id: playerScore.userId || null,
            participant_number: playerScore.playerNumber,
            display_name: playerScore.playerName,
            participant_type: this.toParticipantType(playerScore.playerType),
            team_key: playerScore.teamNumber?.toString() ?? null,
            faction_key: playerScore.factionType,
            result_status: playerScore.gameResult,
            eliminated: playerScore.eliminated,
            eliminated_at: playerScore.eliminatedAt ? new Date(playerScore.eliminatedAt).toISOString() : null,
            metadata: {
              originalPlayerType: playerScore.playerType
            }
          })
          .select("id")
          .single();

        if (participantError) {
          console.error("Failed to insert participant:", participantError);
          await this.clearIncompleteSessionData(session.id);
          return { success: false, message: `Failed to insert participant: ${participantError.message}` };
        }

        const { data: scoreRecord, error: scoreError } = await this.supabase
          .from("game_score_records")
          .insert({
            game_session_id: session.id,
            participant_id: participant.id,
            user_id: playerScore.userId || null,
            game_key: GameKey.ProbableWaffle,
            score_value: playerScore.finalScore,
            ranking_scope_key: session.map_key,
            submitted_by_user_id: submittedByUserId,
            metadata: {
              playerNumber: playerScore.playerNumber,
              playerType: playerScore.playerType,
              teamNumber: playerScore.teamNumber,
              factionType: playerScore.factionType,
              gameResult: playerScore.gameResult
            }
          })
          .select("id")
          .single();

        if (scoreError) {
          console.error("Failed to insert score record:", scoreError);
          await this.clearIncompleteSessionData(session.id);
          return { success: false, message: `Failed to insert score record: ${scoreError.message}` };
        }

        const metricValues = Object.entries(playerScore.metrics)
          .filter(([, value]) => value > 0)
          .map(([metricKey, metricValue]) => ({
            score_record_id: scoreRecord.id,
            metric_definition_id: metricKeyToId.get(metricKey),
            metric_value: metricValue
          }))
          .filter(
            (metric): metric is { score_record_id: number; metric_definition_id: number; metric_value: number } =>
              metric.metric_definition_id !== undefined
          );

        if (metricValues.length > 0) {
          const { error: metricsError } = await this.supabase.from("game_score_metric_values").insert(metricValues);

          if (metricsError) {
            console.error("Failed to insert metric values:", metricsError);
            await this.clearIncompleteSessionData(session.id);
            return { success: false, message: `Failed to insert metric values: ${metricsError.message}` };
          }
        }
      }

      if (snapshots && snapshots.length > 0) {
        const { error: snapshotError } = await this.supabase.from("game_score_snapshots").insert({
          game_session_id: session.id,
          snapshot_kind: "score_timeline",
          snapshots: snapshots as unknown as Json
        });
        if (snapshotError) {
          console.warn("Failed to insert snapshots (non-critical):", snapshotError);
        }
      }

      const startedAt = new Date(session.started_at);
      const endedAt = new Date();
      const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

      const { error: updateError } = await this.supabase
        .from("game_sessions")
        .update({
          session_status: GameSessionStatus.Completed,
          completed_by_user_id: submittedByUserId,
          completed_at: endedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          total_duration_seconds: durationSeconds
        })
        .eq("id", session.id);

      if (updateError) {
        console.error("Failed to update session:", updateError);
        await this.clearIncompleteSessionData(session.id);
        return { success: false, message: `Failed to update session: ${updateError.message}` };
      }

      await this.refreshScoresView();

      return { success: true, message: "Scores recorded successfully" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error during score submission";
      console.error("Error submitting scores:", error);
      return { success: false, message };
    }
  }

  private async clearIncompleteSessionData(sessionId: string): Promise<void> {
    const { error: snapshotsError } = await this.supabase
      .from("game_score_snapshots")
      .delete()
      .eq("game_session_id", sessionId);
    if (snapshotsError) {
      throw new Error(`Failed to clear stale snapshots: ${snapshotsError.message}`);
    }

    const { error: scoreRecordsError } = await this.supabase
      .from("game_score_records")
      .delete()
      .eq("game_session_id", sessionId);
    if (scoreRecordsError) {
      throw new Error(`Failed to clear stale score records: ${scoreRecordsError.message}`);
    }

    const { error: participantsError } = await this.supabase
      .from("game_session_participants")
      .delete()
      .eq("game_session_id", sessionId);
    if (participantsError) {
      throw new Error(`Failed to clear stale participants: ${participantsError.message}`);
    }
  }

  private async getMetricDefinitionIds(playerScores: PlayerScoreDto[]): Promise<Map<string, number>> {
    const nonZeroMetricKeys = new Set<string>();
    for (const playerScore of playerScores) {
      for (const [key, value] of Object.entries(playerScore.metrics)) {
        if (value > 0) nonZeroMetricKeys.add(key);
      }
    }

    const metricKeys = [...nonZeroMetricKeys];
    if (metricKeys.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase
      .from("game_score_metric_definitions")
      .select("id, metric_key")
      .eq("game_key", GameKey.ProbableWaffle)
      .in("metric_key", metricKeys);

    if (error) {
      throw new Error(`Failed to get metric definitions: ${error.message}`);
    }

    return new Map((data ?? []).map((metric) => [metric.metric_key, metric.id]));
  }

  private toParticipantType(playerType: string): GameParticipantType {
    const normalized = playerType.toLowerCase();
    if (normalized === GameParticipantType.Ai) return GameParticipantType.Ai;
    if (normalized === GameParticipantType.Spectator) return GameParticipantType.Spectator;
    return GameParticipantType.Human;
  }

  private async refreshScoresView(): Promise<void> {
    try {
      await this.supabase.rpc("refresh_game_score_records_full");
    } catch (error) {
      console.warn("Failed to refresh materialized view:", error);
    }
  }

  /**
   * Returns paginated match history for a given user.
   */
  async getMatchHistory(userId: string, limit: number = 20, offset: number = 0): Promise<unknown> {
    const { data: participations, error: partError } = await this.supabase
      .from("game_session_participants")
      .select("game_session_id, result_status")
      .eq("user_id", userId);

    if (partError) {
      console.error("Failed to get match history:", partError);
      throw new Error(`Failed to get match history: ${partError.message}`);
    }

    if (!participations || participations.length === 0) {
      return { matches: [], total: 0, limit, offset };
    }

    const sessionIds = participations.map((p) => p.game_session_id);
    const userResultMap = new Map(
      participations.map((p) => [p.game_session_id, p.result_status ?? GameResultStatus.Quit])
    );

    const {
      data: sessions,
      error: sessError,
      count
    } = await this.supabase
      .from("game_sessions")
      .select(
        "id, external_session_id, game_mode_key, map_key, started_at, ended_at, total_duration_seconds, human_player_count",
        { count: "exact" }
      )
      .eq("game_key", GameKey.ProbableWaffle)
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

    const pageSessionIds = sessions.map((session) => session.id);
    const { data: allParticipants, error: participantError } = await this.supabase
      .from("game_session_participants")
      .select("id, game_session_id, participant_number, display_name, faction_key, result_status, user_id")
      .in("game_session_id", pageSessionIds);

    if (participantError) {
      console.error("Failed to get participants:", participantError);
      throw new Error(`Failed to get participants: ${participantError.message}`);
    }

    const participantIds = (allParticipants ?? []).map((participant) => participant.id);
    const { data: scoreRecords, error: scoreError } = await this.supabase
      .from("game_score_records")
      .select("participant_id, score_value")
      .in("participant_id", participantIds);

    if (scoreError) {
      console.error("Failed to get scores:", scoreError);
      throw new Error(`Failed to get scores: ${scoreError.message}`);
    }

    const scoresByParticipant = new Map((scoreRecords ?? []).map((score) => [score.participant_id, score.score_value]));
    const participantsBySession = new Map<string, typeof allParticipants>();
    for (const participant of allParticipants ?? []) {
      const list = participantsBySession.get(participant.game_session_id) ?? [];
      list.push(participant);
      participantsBySession.set(participant.game_session_id, list);
    }

    const matches = sessions.map((session) => ({
      id: session.id,
      gameInstanceId: session.external_session_id,
      gameType: session.game_mode_key ?? "Skirmish",
      mapId: Number(session.map_key ?? 0),
      startedAt: session.started_at,
      endedAt: session.ended_at,
      totalDurationSeconds: session.total_duration_seconds,
      humanPlayerCount: session.human_player_count,
      userResult: userResultMap.get(session.id) ?? GameResultStatus.Quit,
      players: (participantsBySession.get(session.id) ?? []).map((participant) => ({
        playerNumber: participant.participant_number,
        playerName: participant.display_name,
        factionType: participant.faction_key ?? "",
        gameResult: participant.result_status ?? GameResultStatus.Quit,
        finalScore: scoresByParticipant.get(participant.id) ?? 0,
        isCurrentUser: participant.user_id === userId
      }))
    }));

    return { matches, total: count ?? 0, limit, offset };
  }

  /**
   * Returns full score details for a single match.
   */
  async getMatchDetails(gameInstanceId: string, userId: string): Promise<unknown> {
    const session = await this.getSession(gameInstanceId);
    if (!session) {
      throw new Error("Game session not found");
    }

    const { data: participation, error: participationError } = await this.supabase
      .from("game_session_participants")
      .select("id")
      .eq("game_session_id", session.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (participationError || !participation) {
      throw new Error("User did not participate in this game");
    }

    const { data: participants, error: participantsError } = await this.supabase
      .from("game_session_participants")
      .select("*")
      .eq("game_session_id", session.id)
      .order("participant_number", { ascending: true });

    if (participantsError) {
      console.error("Failed to get participants:", participantsError);
      throw new Error(`Failed to get participants: ${participantsError.message}`);
    }

    const participantIds = (participants ?? []).map((participant) => participant.id);
    const { data: records, error: recordsError } = await this.supabase
      .from("game_score_records")
      .select("id, participant_id, score_value, user_id")
      .in("participant_id", participantIds);

    if (recordsError) {
      console.error("Failed to get score records:", recordsError);
      throw new Error(`Failed to get score records: ${recordsError.message}`);
    }

    const recordIds = (records ?? []).map((record) => record.id);
    const metricsMap = new Map<number, Record<string, number>>();

    if (recordIds.length > 0) {
      const { data: metrics } = await this.supabase
        .from("game_score_metric_values")
        .select("score_record_id, metric_value, game_score_metric_definitions(metric_key)")
        .in("score_record_id", recordIds);

      for (const metric of metrics ?? []) {
        const key = (metric.game_score_metric_definitions )?.metric_key;
        if (!key) continue;
        const existing = metricsMap.get(metric.score_record_id) ?? {};
        existing[key] = metric.metric_value;
        metricsMap.set(metric.score_record_id, existing);
      }
    }

    const recordsByParticipant = new Map((records ?? []).map((record) => [record.participant_id, record]));
    const playerScores = (participants ?? []).map((participant) => {
      const record = recordsByParticipant.get(participant.id);
      const metadata =
        participant.metadata && typeof participant.metadata === "object" && !Array.isArray(participant.metadata)
          ? participant.metadata
          : {};
      return {
        playerNumber: participant.participant_number,
        playerName: participant.display_name,
        playerType: metadata["originalPlayerType"] ?? participant.participant_type,
        teamNumber: participant.team_key ? Number(participant.team_key) : undefined,
        factionType: participant.faction_key ?? "",
        gameResult: participant.result_status ?? GameResultStatus.Quit,
        eliminated: participant.eliminated,
        eliminatedAt: participant.eliminated_at ? new Date(participant.eliminated_at).getTime() : undefined,
        finalScore: record?.score_value ?? 0,
        metrics: record ? (metricsMap.get(record.id) ?? {}) : {},
        userId: participant.user_id ?? undefined
      };
    });

    const startedAt = new Date(session.started_at);
    const endedAt = session.ended_at ? new Date(session.ended_at) : new Date();
    const calculatedDuration = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

    const { data: snapshotRow } = await this.supabase
      .from("game_score_snapshots")
      .select("snapshots")
      .eq("game_session_id", session.id)
      .eq("snapshot_kind", "score_timeline")
      .maybeSingle();

    const snapshots = snapshotRow ? snapshotRow.snapshots : [];

    return {
      gameSession: {
        id: session.id,
        gameInstanceId: session.external_session_id,
        gameType: session.game_mode_key ?? "Skirmish",
        mapId: Number(session.map_key ?? 0),
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
