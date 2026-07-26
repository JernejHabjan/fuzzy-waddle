import {
  type CampaignChapterId,
  type CampaignId,
  type CampaignMissionId,
  type CampaignParticipantProgressionSnapshot,
  type GameSaveRecord
} from "@fuzzy-waddle/probable-waffle-protocol";

/** Defines the remote game save record contract used by this module; its declared members form the compatible boundary for linked consumers. */
export interface RemoteGameSaveRecord {
  /**
   * stable id used by {@link RemoteGameSaveRecord} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  id: GameSaveRecord["id"];
  /**
   * discriminator for {@link RemoteGameSaveRecord}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  scope: GameSaveRecord["scope"];
  /**
   * discriminator for {@link RemoteGameSaveRecord}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  kind: GameSaveRecord["kind"];
  /**
   * human-facing name for {@link RemoteGameSaveRecord}. It supports UI, narration, or diagnostics and must not
   * be used as the stable identity of the record.
   */
  name: string | null;
  /**
   * campaign id value carried by {@link RemoteGameSaveRecord}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign_id: CampaignId | null;
  /**
   * campaign chapter id value carried by {@link RemoteGameSaveRecord}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign_chapter_id: CampaignChapterId | null;
  /**
   * campaign mission id value carried by {@link RemoteGameSaveRecord}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign_mission_id: CampaignMissionId | null;
  /**
   * campaign run id value carried by {@link RemoteGameSaveRecord}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign_run_id: string | null;
  /**
   * compatibility campaign mission revision for {@link RemoteGameSaveRecord}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  campaign_mission_revision: number | null;
  /**
   * compatibility campaign runtime schema version for {@link RemoteGameSaveRecord}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  campaign_runtime_schema_version: number | null;
  /**
   * compatibility campaign profile revision for {@link RemoteGameSaveRecord}. Consumers use it to choose
   * validation, migration, or conflict-handling rules instead of guessing the payload shape.
   */
  campaign_profile_revision: number | null;
  /**
   * collection value on {@link RemoteGameSaveRecord}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  campaign_loadout_ids: string[] | null;
  /**
   * campaign loadout snapshot hash value carried by {@link RemoteGameSaveRecord}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  campaign_loadout_snapshot_hash: string | null;
  /**
   * campaign checkpoint id value carried by {@link RemoteGameSaveRecord}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  campaign_checkpoint_id: string | null;
  /**
   * numeric bound or quantity carried by {@link RemoteGameSaveRecord}. Interpret it in the owning contract’s
   * units and preserve its validation constraints at boundaries.
   */
  campaign_participant_count: number | null;
  /**
   * collection value on {@link RemoteGameSaveRecord}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  campaign_participant_progression_snapshots: CampaignParticipantProgressionSnapshot[] | null;
  /**
   * compatibility revision for {@link RemoteGameSaveRecord}. Consumers use it to choose validation, migration,
   * or conflict-handling rules instead of guessing the payload shape.
   */
  revision: number;
  /**
   * boolean policy/value on {@link RemoteGameSaveRecord} that explicitly controls whether the associated
   * behavior is active; do not infer it from unrelated state.
   */
  is_deleted: boolean;
  /**
   * thumbnail value carried by {@link RemoteGameSaveRecord}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  thumbnail: string | null;
  /**
   * compatibility format version for {@link RemoteGameSaveRecord}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  format_version: number;
  /**
   * string encoded game instance data carried by {@link RemoteGameSaveRecord}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  encoded_game_instance_data: string;
  /**
   * temporal value for {@link RemoteGameSaveRecord}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  created_at: string;
  /**
   * temporal value for {@link RemoteGameSaveRecord}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  updated_at: string;
}
