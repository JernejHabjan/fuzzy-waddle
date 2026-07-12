create table public.probable_waffle_campaign_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz not null default now(),
  result_metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, mission_id)
);

create table public.probable_waffle_game_saves (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('campaign', 'skirmish')),
  kind text not null check (kind in ('manual', 'autosave')),
  name text null,
  campaign_chapter_id text null,
  campaign_mission_id text null,
  campaign_run_id text null,
  revision integer not null check (revision > 0),
  is_deleted boolean not null default false,
  thumbnail text null,
  game_instance_data jsonb not null,
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
alter table public.probable_waffle_game_saves enable row level security;
create policy "Service role owns campaign progress" on public.probable_waffle_campaign_progress for all to service_role using (true) with check (true);
create policy "Service role owns game saves" on public.probable_waffle_game_saves for all to service_role using (true) with check (true);
grant select, insert, update, delete on public.probable_waffle_campaign_progress to service_role;
grant select, insert, update, delete on public.probable_waffle_game_saves to service_role;
