alter table public.probable_waffle_game_saves
  add column campaign_participant_progression_snapshots jsonb null;

alter table public.probable_waffle_game_saves
  drop constraint campaign_save_scope;

alter table public.probable_waffle_game_saves
  add constraint campaign_save_scope check (
    is_deleted
    or (scope = 'campaign' and campaign_id is not null and campaign_chapter_id is not null and campaign_mission_id is not null and campaign_run_id is not null and campaign_mission_revision is not null and campaign_runtime_schema_version is not null and campaign_profile_revision is not null and campaign_participant_count is not null)
    or (scope = 'skirmish' and campaign_id is null and campaign_chapter_id is null and campaign_mission_id is null and campaign_run_id is null and campaign_mission_revision is null and campaign_runtime_schema_version is null and campaign_profile_revision is null and campaign_checkpoint_id is null and campaign_participant_count is null and campaign_participant_progression_snapshots is null)
  );
