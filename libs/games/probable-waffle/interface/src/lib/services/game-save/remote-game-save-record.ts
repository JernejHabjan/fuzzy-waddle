import {
  GAME_SAVE_FORMAT_VERSION,
  type CampaignChapterId,
  type CampaignMissionId,
  type GameSaveRecord
} from "@fuzzy-waddle/api-interfaces";

/** API representation of a searchable save record whose game payload remains encoded. */
export interface RemoteGameSaveRecord {
  id: GameSaveRecord["id"];
  scope: GameSaveRecord["scope"];
  kind: GameSaveRecord["kind"];
  name: string | null;
  campaign_chapter_id: CampaignChapterId | null;
  campaign_mission_id: CampaignMissionId | null;
  campaign_run_id: string | null;
  revision: number;
  is_deleted: boolean;
  thumbnail: string | null;
  format_version: typeof GAME_SAVE_FORMAT_VERSION;
  encoded_game_instance_data: string;
  created_at: string;
  updated_at: string;
}
