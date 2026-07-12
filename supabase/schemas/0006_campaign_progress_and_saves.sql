create type public.probable_waffle_campaign_chapter_id as enum (
  'prologue', 'two-homelands', 'crystal-war', 'united-against-volcano', 'the-betrayal'
);
create type public.probable_waffle_campaign_mission_id as enum (
  'dreams', 'cyclops-and-sheep', 'snow-wendigo-and-fire', 'slingshooters-and-wolves',
  'owl-and-skaduwee-crystal', 'sand-dunes-and-tivara-crystal', 'we-had-enough',
  'sailing-towards-the-new-future', 'the-first-and-last-dinner', 'the-siege', 'time-rush',
  'joining-crystal', 'mobster-or-friend', 'the-volcano-is-getting-angry', 'cult-wars',
  'the-volcano', 'the-betrayal', 'undead-and-cursed-lands', 'end-game', 'resolution'
);
create type public.probable_waffle_campaign_outcome as enum ('victory', 'defeat', 'abandoned');
create type public.probable_waffle_game_save_scope as enum ('campaign', 'skirmish');
create type public.probable_waffle_game_save_kind as enum ('manual', 'autosave');

create table public.probable_waffle_campaign_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id public.probable_waffle_campaign_mission_id not null,
  completed_at timestamptz not null default now(),
  result_metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, mission_id)
);

create table public.probable_waffle_campaign_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id public.probable_waffle_campaign_mission_id not null,
  outcome public.probable_waffle_campaign_outcome null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  result_metadata jsonb not null default '{}'::jsonb
);

create table public.probable_waffle_game_saves (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope public.probable_waffle_game_save_scope not null,
  kind public.probable_waffle_game_save_kind not null,
  name text null,
  campaign_chapter_id public.probable_waffle_campaign_chapter_id null,
  campaign_mission_id public.probable_waffle_campaign_mission_id null,
  campaign_run_id uuid null,
  format_version integer not null check (format_version > 0),
  revision integer not null check (revision > 0),
  is_deleted boolean not null default false,
  thumbnail text null,
  encoded_game_instance_data text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_save_scope check (
    (scope = 'campaign' and campaign_chapter_id is not null and campaign_mission_id is not null and campaign_run_id is not null)
    or (scope = 'skirmish' and campaign_chapter_id is null and campaign_mission_id is null and campaign_run_id is null)
  )
);

create index probable_waffle_game_saves_user_updated_idx on public.probable_waffle_game_saves(user_id, updated_at desc);
create index probable_waffle_game_saves_campaign_idx on public.probable_waffle_game_saves(user_id, campaign_mission_id, updated_at desc) where is_deleted = false;
create trigger probable_waffle_game_saves_updated_at before update on public.probable_waffle_game_saves for each row execute function public.set_updated_at();

alter table public.probable_waffle_campaign_progress enable row level security;
alter table public.probable_waffle_campaign_runs enable row level security;
alter table public.probable_waffle_game_saves enable row level security;
create policy "Service role owns campaign progress" on public.probable_waffle_campaign_progress for all to service_role using (true) with check (true);
create policy "Service role owns campaign runs" on public.probable_waffle_campaign_runs for all to service_role using (true) with check (true);
create policy "Service role owns game saves" on public.probable_waffle_game_saves for all to service_role using (true) with check (true);
grant select, insert, update, delete on public.probable_waffle_campaign_progress to service_role;
grant select, insert, update, delete on public.probable_waffle_campaign_runs to service_role;
grant select, insert, update, delete on public.probable_waffle_game_saves to service_role;
