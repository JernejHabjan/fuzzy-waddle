import { Injectable } from "@nestjs/common";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import type { CampaignResultDto } from "./campaign.dto";

@Injectable()
export class CampaignServerService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async progress(userId: string) {
    const { data, error } = await this.table("probable_waffle_campaign_progress")
      .select("mission_id, completed_at")
      .eq("user_id", userId);
    if (error) throw error;
    return {
      completedMissions: (data ?? []).map((row: { mission_id: string; completed_at: string }) => ({
        missionId: row.mission_id,
        completedAt: row.completed_at
      }))
    };
  }

  async start(userId: string, runId: string, missionId: string): Promise<void> {
    const { error } = await this.table("probable_waffle_campaign_runs").upsert(
      { id: runId, user_id: userId, mission_id: missionId },
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  /** Result writes are owner-scoped and idempotent; only victories add completion progress. */
  async result(userId: string, result: CampaignResultDto): Promise<void> {
    const runs = this.table("probable_waffle_campaign_runs");
    const { data: run, error: readError } = await runs
      .select("id, mission_id, outcome")
      .eq("id", result.runId)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    if (!run || run.mission_id !== result.missionId || run.outcome) return;
    const { error } = await runs
      .update({
        outcome: result.outcome,
        completed_at: new Date().toISOString(),
        result_metadata: {
          durationSeconds: result.durationSeconds,
          completedObjectiveIds: result.completedObjectiveIds ?? []
        }
      })
      .eq("id", result.runId)
      .eq("user_id", userId);
    if (error) throw error;
    if (result.outcome === "victory") {
      const { error: progressError } = await this.table("probable_waffle_campaign_progress").upsert(
        { user_id: userId, mission_id: result.missionId },
        { onConflict: "user_id,mission_id" }
      );
      if (progressError) throw progressError;
    }
  }

  async merge(userId: string, completions: Array<{ missionId: string; completedAt: string }>): Promise<void> {
    const progress = this.table("probable_waffle_campaign_progress");
    for (const completion of completions) {
      if (!completion.missionId || Number.isNaN(Date.parse(completion.completedAt))) continue;
      const { data: existing, error: readError } = await progress
        .select("completed_at")
        .eq("user_id", userId)
        .eq("mission_id", completion.missionId)
        .maybeSingle();
      if (readError) throw readError;
      const completedAt =
        existing?.completed_at && existing.completed_at < completion.completedAt
          ? existing.completed_at
          : completion.completedAt;
      const { error } = await progress.upsert(
        { user_id: userId, mission_id: completion.missionId, completed_at: completedAt },
        { onConflict: "user_id,mission_id" }
      );
      if (error) throw error;
    }
  }

  private table(name: string) {
    // Generated database typings are refreshed after the migration is applied.
    return this.supabaseProviderService.supabaseClient.from(name as never) as any;
  }
}
