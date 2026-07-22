import { BadRequestException, Injectable } from "@nestjs/common";
import { GameSaveScope, isCampaignMissionInChapter } from "@fuzzy-waddle/probable-waffle-protocol";
import { SupabaseProviderService } from "@fuzzy-waddle/platform-database-schema/server/supabase-provider/supabase-provider.service";
import type { SyncGameSaveDto } from "./game-save.dto";
import type { GameSaveServerServiceInterface } from "./game-save.service.interface";

@Injectable()
/** Persists owner-scoped encoded saves without decoding client game state. */
export class GameSaveServerService implements GameSaveServerServiceInterface {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async list(userId: string) {
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("probable_waffle_game_saves")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  /** The user id is always supplied by the authenticated request, never by the client payload. */
  async upsert(userId: string, dto: SyncGameSaveDto) {
    this.validateScope(dto);
    const { data: existing, error: readError } = await this.supabaseProviderService.supabaseClient
      .from("probable_waffle_game_saves")
      .select("revision")
      .eq("id", dto.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    // Equal revisions are already persisted; accepting them again could overwrite a newer server timestamp.
    if (existing && existing.revision >= dto.revision) return existing;
    const { data, error } = await this.supabaseProviderService.supabaseClient
      .from("probable_waffle_game_saves")
      .upsert({
        id: dto.id,
        user_id: userId,
        scope: dto.scope,
        kind: dto.kind,
        name: dto.name ?? null,
        campaign_id: dto.campaignId ?? null,
        campaign_chapter_id: dto.campaignChapterId ?? null,
        campaign_mission_id: dto.campaignMissionId ?? null,
        campaign_run_id: dto.campaignRunId ?? null,
        campaign_mission_revision: dto.campaignMissionRevision ?? null,
        campaign_runtime_schema_version: dto.campaignRuntimeSchemaVersion ?? null,
        campaign_profile_revision: dto.campaignProfileRevision ?? null,
        campaign_loadout_ids: dto.campaignLoadoutIds ?? null,
        campaign_loadout_snapshot_hash: dto.campaignLoadoutSnapshotHash ?? null,
        campaign_checkpoint_id: dto.campaignCheckpointId ?? null,
        campaign_participant_count: dto.campaignParticipantCount ?? null,
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

  /** Ensures campaign metadata is complete, related, and absent from skirmish records before storage. */
  private validateScope(dto: SyncGameSaveDto): void {
    if (dto.isDeleted) return;
    const campaignFields = [
      dto.campaignId,
      dto.campaignChapterId,
      dto.campaignMissionId,
      dto.campaignRunId,
      dto.campaignMissionRevision,
      dto.campaignRuntimeSchemaVersion,
      dto.campaignProfileRevision,
      dto.campaignLoadoutIds,
      dto.campaignLoadoutSnapshotHash,
      dto.campaignCheckpointId,
      dto.campaignParticipantCount
    ];
    if (dto.scope === GameSaveScope.Campaign) {
      if (
        !dto.campaignId ||
        !dto.campaignChapterId ||
        !dto.campaignMissionId ||
        !dto.campaignRunId ||
        !dto.campaignMissionRevision ||
        !dto.campaignRuntimeSchemaVersion ||
        dto.campaignProfileRevision === undefined ||
        !dto.campaignParticipantCount
      ) {
        throw new BadRequestException("Campaign saves require complete campaign runtime metadata");
      }
      if (!isCampaignMissionInChapter(dto.campaignChapterId, dto.campaignMissionId)) {
        throw new BadRequestException("Campaign mission does not belong to the supplied chapter");
      }
      return;
    }
    if (campaignFields.some(Boolean)) {
      throw new BadRequestException("Skirmish saves cannot include campaign identifiers");
    }
  }
}
