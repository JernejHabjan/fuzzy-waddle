alter table public.probable_waffle_game_saves
  add column campaign_id text null,
  add column campaign_mission_revision integer null check (campaign_mission_revision is null or campaign_mission_revision > 0),
  add column campaign_runtime_schema_version integer null check (campaign_runtime_schema_version is null or campaign_runtime_schema_version > 0),
  add column campaign_profile_revision integer null check (campaign_profile_revision is null or campaign_profile_revision >= 0),
  add column campaign_checkpoint_id text null,
  add column campaign_participant_count integer null check (campaign_participant_count is null or campaign_participant_count > 0);

alter table public.probable_waffle_game_saves drop constraint campaign_save_scope;

alter table public.probable_waffle_game_saves
  add constraint campaign_save_scope check (
    is_deleted
    or (scope = 'campaign' and campaign_id is not null and campaign_chapter_id is not null and campaign_mission_id is not null and campaign_run_id is not null and campaign_mission_revision is not null and campaign_runtime_schema_version is not null and campaign_profile_revision is not null and campaign_participant_count is not null)
    or (scope = 'skirmish' and campaign_id is null and campaign_chapter_id is null and campaign_mission_id is null and campaign_run_id is null and campaign_mission_revision is null and campaign_runtime_schema_version is null and campaign_profile_revision is null and campaign_checkpoint_id is null and campaign_participant_count is null)
  ) not valid;
