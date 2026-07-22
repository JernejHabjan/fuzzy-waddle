create type public.probable_waffle_game_save_scope as enum ('campaign', 'skirmish');
create type public.probable_waffle_game_save_kind as enum ('manual', 'autosave', 'quicksave', 'archive');

create table public.probable_waffle_game_saves (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope public.probable_waffle_game_save_scope not null,
  kind public.probable_waffle_game_save_kind not null,
  name text null,
  campaign_id text null,
  campaign_chapter_id public.probable_waffle_campaign_chapter_id null,
  campaign_mission_id public.probable_waffle_campaign_mission_id null,
  campaign_run_id uuid null,
  campaign_mission_revision integer null check (campaign_mission_revision is null or campaign_mission_revision > 0),
  campaign_runtime_schema_version integer null check (campaign_runtime_schema_version is null or campaign_runtime_schema_version > 0),
  campaign_profile_revision integer null check (campaign_profile_revision is null or campaign_profile_revision >= 0),
  campaign_checkpoint_id text null,
  campaign_participant_count integer null check (campaign_participant_count is null or campaign_participant_count > 0),
  format_version integer not null check (format_version > 0),
  revision integer not null check (revision > 0),
  is_deleted boolean not null default false,
  thumbnail text null,
  encoded_game_instance_data text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_save_scope check (
    is_deleted
    or (scope = 'campaign' and campaign_id is not null and campaign_chapter_id is not null and campaign_mission_id is not null and campaign_run_id is not null and campaign_mission_revision is not null and campaign_runtime_schema_version is not null and campaign_profile_revision is not null and campaign_participant_count is not null)
    or (scope = 'skirmish' and campaign_id is null and campaign_chapter_id is null and campaign_mission_id is null and campaign_run_id is null and campaign_mission_revision is null and campaign_runtime_schema_version is null and campaign_profile_revision is null and campaign_checkpoint_id is null and campaign_participant_count is null)
  )
);

create index probable_waffle_game_saves_user_updated_idx on public.probable_waffle_game_saves(user_id, updated_at desc);
create index probable_waffle_game_saves_campaign_idx on public.probable_waffle_game_saves(user_id, campaign_mission_id, updated_at desc) where is_deleted = false;
create trigger probable_waffle_game_saves_updated_at before update on public.probable_waffle_game_saves for each row execute function public.set_updated_at();

alter table public.probable_waffle_game_saves enable row level security;
create policy "Service role owns game saves" on public.probable_waffle_game_saves for all to service_role using (true) with check (true);
grant select, insert, update, delete on public.probable_waffle_game_saves to service_role;
