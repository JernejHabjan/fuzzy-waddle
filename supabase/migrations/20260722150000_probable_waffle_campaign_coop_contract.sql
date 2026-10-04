-- Participant progression is stored with the campaign snapshot rather than inferred from
-- currently connected clients. Restore/reconnect can therefore recreate the same solo
-- control transfer or future co-op ownership layout before mission triggers resume.

alter table public.probable_waffle_game_saves
  add column campaign_participant_progression_snapshots jsonb null;

comment on column public.probable_waffle_game_saves.campaign_participant_progression_snapshots is
  'Per-participant progression snapshots required to restore and reconnect a co-op campaign without inferring ownership from live clients.';

alter table public.probable_waffle_game_saves
  drop constraint campaign_save_scope;

alter table public.probable_waffle_game_saves
  add constraint campaign_save_scope check (
    is_deleted
    or (scope = 'campaign' and campaign_id is not null and campaign_chapter_id is not null and campaign_mission_id is not null and campaign_run_id is not null and campaign_mission_revision is not null and campaign_runtime_schema_version is not null and campaign_profile_revision is not null and campaign_participant_count is not null)
    or (scope = 'skirmish' and campaign_id is null and campaign_chapter_id is null and campaign_mission_id is null and campaign_run_id is null and campaign_mission_revision is null and campaign_runtime_schema_version is null and campaign_profile_revision is null and campaign_checkpoint_id is null and campaign_participant_count is null and campaign_participant_progression_snapshots is null)
  );
