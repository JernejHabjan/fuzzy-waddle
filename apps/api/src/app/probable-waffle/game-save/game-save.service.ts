import { Injectable } from "@nestjs/common";
import { SupabaseProviderService } from "../../../core/supabase-provider/supabase-provider.service";
import type { SyncGameSaveDto } from "./game-save.dto";
import type { GameSaveServerServiceInterface } from "./game-save.service.interface";

@Injectable()
/** Persists owner-scoped encoded saves without decoding client game state. */
export class GameSaveServerService implements GameSaveServerServiceInterface {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async list(userId: string) {
    const { data, error } = await this.table()
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  /** The user id is always supplied by the authenticated request, never by the client payload. */
  async upsert(userId: string, dto: SyncGameSaveDto) {
    const { data: existing, error: readError } = await this.table()
      .select("revision")
      .eq("id", dto.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing && existing.revision > dto.revision) return existing;
    const { data, error } = await this.table()
      .upsert({
        id: dto.id,
        user_id: userId,
        scope: dto.scope,
        kind: dto.kind,
        name: dto.name ?? null,
        campaign_chapter_id: dto.campaignChapterId ?? null,
        campaign_mission_id: dto.campaignMissionId ?? null,
        campaign_run_id: dto.campaignRunId ?? null,
        revision: dto.revision,
        format_version: dto.formatVersion,
        is_deleted: dto.isDeleted,
        thumbnail: dto.thumbnail ?? null,
        encoded_game_instance_data: dto.encodedGameInstanceData
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  private table() {
    // Database typings are regenerated separately from Supabase migrations.
    return this.supabaseProviderService.supabaseClient.from("probable_waffle_game_saves" as never) as any;
  }
}
