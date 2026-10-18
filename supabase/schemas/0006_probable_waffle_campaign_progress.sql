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

alter table public.probable_waffle_campaign_progress enable row level security;
alter table public.probable_waffle_campaign_runs enable row level security;
create policy "Service role owns campaign progress" on public.probable_waffle_campaign_progress for all to service_role using (true) with check (true);
create policy "Service role owns campaign runs" on public.probable_waffle_campaign_runs for all to service_role using (true) with check (true);
grant select, insert, update, delete on public.probable_waffle_campaign_progress to service_role;
grant select, insert, update, delete on public.probable_waffle_campaign_runs to service_role;
