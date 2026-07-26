-- Campaign save metadata is an index over the canonical serialized campaignMission
-- snapshot; it must never become a second mutable mission-state authority.
--
-- campaignMission snapshot -> searchable save metadata -> restore identity/migration
--          |                           |
--          +---- save/hash/replay ------+---- UI listing and checkpoint recovery

alter table public.probable_waffle_game_saves
  add column campaign_id text null,
  add column campaign_mission_revision integer null check (campaign_mission_revision is null or campaign_mission_revision > 0),
  add column campaign_runtime_schema_version integer null check (campaign_runtime_schema_version is null or campaign_runtime_schema_version > 0),
  add column campaign_profile_revision integer null check (campaign_profile_revision is null or campaign_profile_revision >= 0),
  add column campaign_checkpoint_id text null,
  add column campaign_participant_count integer null check (campaign_participant_count is null or campaign_participant_count > 0);

comment on column public.probable_waffle_game_saves.campaign_id is
  'Stable campaign catalogue ID. Together with chapter and mission IDs, it makes campaign saves searchable without reading the runtime blob.';
comment on column public.probable_waffle_game_saves.campaign_mission_revision is
  'Authored mission revision used to select an explicit campaign-save migration during restore.';
comment on column public.probable_waffle_game_saves.campaign_runtime_schema_version is
  'Version of the serialized deterministic campaignMission runtime snapshot.';
comment on column public.probable_waffle_game_saves.campaign_profile_revision is
  'Profile revision from which this run started; restores use it to detect stale reward state.';
comment on column public.probable_waffle_game_saves.campaign_checkpoint_id is
  'Optional stable authored checkpoint that produced this save.';
comment on column public.probable_waffle_game_saves.campaign_participant_count is
  'Number of campaign participants represented by the synchronized save state.';

alter table public.probable_waffle_game_saves drop constraint campaign_save_scope;

alter table public.probable_waffle_game_saves
  add constraint campaign_save_scope check (
    is_deleted
    or (scope = 'campaign' and campaign_id is not null and campaign_chapter_id is not null and campaign_mission_id is not null and campaign_run_id is not null and campaign_mission_revision is not null and campaign_runtime_schema_version is not null and campaign_profile_revision is not null and campaign_participant_count is not null)
    or (scope = 'skirmish' and campaign_id is null and campaign_chapter_id is null and campaign_mission_id is null and campaign_run_id is null and campaign_mission_revision is null and campaign_runtime_schema_version is null and campaign_profile_revision is null and campaign_checkpoint_id is null and campaign_participant_count is null)
  ) not valid;

comment on constraint campaign_save_scope on public.probable_waffle_game_saves is
  'Keeps campaign metadata complete and keeps skirmish rows free of campaign-only values.';
