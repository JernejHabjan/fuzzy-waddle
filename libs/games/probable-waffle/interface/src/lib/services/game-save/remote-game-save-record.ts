import {
  type CampaignChapterId,
  type CampaignId,
  type CampaignMissionId,
  type CampaignParticipantProgressionSnapshot,
  type GameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";

/** API representation of a searchable save record whose game payload remains encoded. */
export interface RemoteGameSaveRecord {
  id: GameSaveRecord["id"];
  scope: GameSaveRecord["scope"];
  kind: GameSaveRecord["kind"];
  name: string | null;
  campaign_id: CampaignId | null;
  campaign_chapter_id: CampaignChapterId | null;
  campaign_mission_id: CampaignMissionId | null;
  campaign_run_id: string | null;
  campaign_mission_revision: number | null;
  campaign_runtime_schema_version: number | null;
  campaign_profile_revision: number | null;
  campaign_loadout_ids: string[] | null;
  campaign_loadout_snapshot_hash: string | null;
  campaign_checkpoint_id: string | null;
  campaign_participant_count: number | null;
  campaign_participant_progression_snapshots: CampaignParticipantProgressionSnapshot[] | null;
  revision: number;
  is_deleted: boolean;
  thumbnail: string | null;
  format_version: number;
  encoded_game_instance_data: string;
  created_at: string;
  updated_at: string;
}
