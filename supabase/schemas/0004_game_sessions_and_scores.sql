drop view if exists public.little_muncher_leaderboard;
drop view if exists public.fly_squasher_leaderboard;
drop view if exists public.game_leaderboard_scores;
drop function if exists public.refresh_game_score_records_full();
drop materialized view if exists public.game_score_records_full;
drop table if exists public.game_score_snapshots cascade;
drop table if exists public.game_score_metric_values cascade;
drop table if exists public.game_score_metric_definitions cascade;
drop table if exists public.game_score_records cascade;
drop table if exists public.game_session_participants cascade;
drop table if exists public.game_sessions cascade;
drop type if exists public.game_result_status cascade;
drop type if exists public.game_participant_type cascade;
drop type if exists public.game_session_status cascade;

create type public.game_session_status as enum ('in_progress', 'completed', 'abandoned');
create type public.game_participant_type as enum ('human', 'ai', 'spectator');
create type public.game_result_status as enum ('win', 'loss', 'tie', 'quit');

create table public.game_sessions
(
  id                     uuid primary key default gen_random_uuid(),
  external_session_id    uuid null,
  game_key               text not null,
  game_mode_key          text null,
  level_key              text null,
  map_key                text null,
  session_status         public.game_session_status not null default 'in_progress',
  started_at             timestamp with time zone not null default now(),
  ended_at               timestamp with time zone null,
  total_duration_seconds int null,
  created_by_user_id     uuid null references public.user_profiles (id) on delete set null,
  completed_by_user_id   uuid null references public.user_profiles (id) on delete set null,
  completed_at           timestamp with time zone null,
  human_player_count     int not null default 1,
  metadata               jsonb not null default '{}'::jsonb,
  created_at             timestamp with time zone not null default now(),
  updated_at             timestamp with time zone not null default now(),
  constraint game_sessions_game_key_not_blank check (length(btrim(game_key)) > 0),
  constraint game_sessions_human_player_count_check check (human_player_count >= 0)
);

create unique index game_sessions_external_session_id_idx
  on public.game_sessions (external_session_id)
  where external_session_id is not null;

create index game_sessions_game_level_idx
  on public.game_sessions (game_key, level_key, map_key);

create index game_sessions_created_by_user_id_idx
  on public.game_sessions (created_by_user_id)
  where created_by_user_id is not null;

create trigger game_sessions_set_updated_at
  before update on public.game_sessions
  for each row
execute function public.set_updated_at();

create table public.game_session_participants
(
  id                bigserial primary key,
  game_session_id   uuid not null references public.game_sessions (id) on delete cascade,
  user_id           uuid null references public.user_profiles (id) on delete set null,
  participant_number int not null,
  display_name      text not null,
  participant_type  public.game_participant_type not null default 'human',
  team_key          text null,
  faction_key       text null,
  result_status     public.game_result_status null,
  eliminated        boolean not null default false,
  eliminated_at     timestamp with time zone null,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamp with time zone not null default now(),
  constraint game_session_participants_eliminated_at_check check (eliminated_at is null or eliminated)
);

create unique index game_session_participants_session_number_idx
  on public.game_session_participants (game_session_id, participant_number);

create index game_session_participants_user_id_idx
  on public.game_session_participants (user_id)
  where user_id is not null;

create table public.game_score_records
(
  id                  bigserial primary key,
  game_session_id     uuid not null references public.game_sessions (id) on delete cascade,
  participant_id      bigint null references public.game_session_participants (id) on delete cascade,
  user_id             uuid null references public.user_profiles (id) on delete set null,
  game_key            text not null,
  score_value         int not null,
  score_unit          text not null default 'points',
  ranking_scope_key   text null,
  submitted_by_user_id uuid null references public.user_profiles (id) on delete set null,
  submitted_at        timestamp with time zone not null default now(),
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamp with time zone not null default now(),
  constraint game_score_records_game_key_not_blank check (length(btrim(game_key)) > 0)
);

create index game_score_records_game_scope_score_idx
  on public.game_score_records (game_key, ranking_scope_key, score_value desc, submitted_at asc);

create index game_score_records_user_id_idx
  on public.game_score_records (user_id)
  where user_id is not null;

create index game_score_records_session_id_idx
  on public.game_score_records (game_session_id);

create table public.game_score_metric_definitions
(
  id              serial primary key,
  game_key        text not null,
  metric_key      text not null,
  metric_name     text not null,
  metric_category text not null,
  description     text null,
  display_order   int not null default 0,
  is_active       boolean not null default true,
  created_at      timestamp with time zone not null default now(),
  constraint game_score_metric_definitions_unique unique (game_key, metric_key)
);

create table public.game_score_metric_values
(
  id                   bigserial primary key,
  score_record_id       bigint not null references public.game_score_records (id) on delete cascade,
  metric_definition_id  int not null references public.game_score_metric_definitions (id),
  metric_value          bigint not null default 0,
  created_at            timestamp with time zone not null default now()
);

create unique index game_score_metric_values_unique_idx
  on public.game_score_metric_values (score_record_id, metric_definition_id);

create table public.game_score_snapshots
(
  id              bigserial primary key,
  game_session_id uuid not null references public.game_sessions (id) on delete cascade,
  snapshot_kind   text not null default 'score_timeline',
  snapshots       jsonb not null,
  created_at      timestamp with time zone not null default now()
);

create unique index game_score_snapshots_session_kind_idx
  on public.game_score_snapshots (game_session_id, snapshot_kind);

insert into public.game_score_metric_definitions (game_key, metric_key, metric_name, metric_category, description, display_order) values
('probable-waffle', 'units_produced', 'Units Produced', 'units', 'Total number of units created', 1),
('probable-waffle', 'units_killed', 'Units Killed', 'units', 'Total enemy units destroyed', 2),
('probable-waffle', 'units_lost', 'Units Lost', 'units', 'Total own units lost', 3),
('probable-waffle', 'buildings_constructed', 'Buildings Constructed', 'buildings', 'Total buildings completed', 11),
('probable-waffle', 'buildings_destroyed', 'Buildings Destroyed', 'buildings', 'Total enemy buildings destroyed', 12),
('probable-waffle', 'buildings_lost', 'Buildings Lost', 'buildings', 'Total own buildings lost', 13),
('probable-waffle', 'resources_collected_minerals', 'Minerals Collected', 'resources', 'Total minerals gathered', 21),
('probable-waffle', 'resources_collected_stone', 'Stone Collected', 'resources', 'Total stone gathered', 22),
('probable-waffle', 'resources_collected_wood', 'Wood Collected', 'resources', 'Total wood gathered', 23),
('probable-waffle', 'resources_spent_minerals', 'Minerals Spent', 'resources', 'Total minerals used', 24),
('probable-waffle', 'resources_spent_stone', 'Stone Spent', 'resources', 'Total stone used', 25),
('probable-waffle', 'resources_spent_wood', 'Wood Spent', 'resources', 'Total wood used', 26),
('probable-waffle', 'final_resources_minerals', 'Final Minerals', 'resources', 'Minerals remaining at end', 27),
('probable-waffle', 'final_resources_stone', 'Final Stone', 'resources', 'Stone remaining at end', 28),
('probable-waffle', 'final_resources_wood', 'Final Wood', 'resources', 'Wood remaining at end', 29),
('probable-waffle', 'damage_dealt', 'Damage Dealt', 'combat', 'Total damage inflicted', 31),
('probable-waffle', 'damage_received', 'Damage Received', 'combat', 'Total damage taken', 32),
('probable-waffle', 'healing_done', 'Healing Done', 'combat', 'Total healing provided', 33),
('probable-waffle', 'max_army_size', 'Max Army Size', 'economy', 'Peak unit count achieved', 41),
('probable-waffle', 'max_building_count', 'Max Building Count', 'economy', 'Peak building count achieved', 42)
on conflict (game_key, metric_key) do nothing;

create view public.game_leaderboard_scores
  with (security_invoker=on)
as
select
  r.id,
  r.game_key,
  r.ranking_scope_key,
  r.score_value,
  r.user_id,
  p.display_name,
  r.submitted_at,
  r.metadata,
  row_number() over (
    partition by r.game_key, r.ranking_scope_key
    order by r.score_value desc, r.submitted_at asc
  ) as scope_rank,
  row_number() over (
    partition by r.game_key, r.ranking_scope_key, r.user_id
    order by r.score_value desc, r.submitted_at asc
  ) as user_scope_rank
from public.game_score_records r
left join public.user_profiles p on p.id = r.user_id;

create view public.fly_squasher_leaderboard
  with (security_invoker=on)
as
select id,
       score_value as score,
       ranking_scope_key::int as level,
       user_id,
       display_name as name,
       submitted_at as date
from public.game_leaderboard_scores
where game_key = 'fly-squasher'
  and user_scope_rank = 1
  and scope_rank <= 3;

create view public.little_muncher_leaderboard
  with (security_invoker=on)
as
select id,
       score_value as score,
       ranking_scope_key::int as hill,
       user_id,
       display_name as user_name,
       submitted_at as date
from public.game_leaderboard_scores
where game_key = 'little-muncher'
  and user_scope_rank = 1
  and scope_rank <= 3;

create materialized view public.game_score_records_full as
select
  r.id,
  r.game_session_id,
  r.participant_id,
  r.user_id,
  r.game_key,
  r.score_value,
  r.ranking_scope_key,
  r.submitted_at,
  p.participant_number,
  p.display_name,
  p.participant_type,
  p.team_key,
  p.faction_key,
  p.result_status,
  p.eliminated,
  p.eliminated_at,
  jsonb_object_agg(d.metric_key, v.metric_value) filter (where d.metric_key is not null) as metrics
from public.game_score_records r
left join public.game_session_participants p on p.id = r.participant_id
left join public.game_score_metric_values v on v.score_record_id = r.id
left join public.game_score_metric_definitions d on d.id = v.metric_definition_id
group by r.id, p.id;

create unique index game_score_records_full_id_idx
  on public.game_score_records_full (id);

create or replace function public.refresh_game_score_records_full()
  returns void
  language plpgsql
  set search_path = public, pg_temp
as $$
begin
  refresh materialized view concurrently public.game_score_records_full;
end;
$$;

alter table public.game_sessions enable row level security;
alter table public.game_session_participants enable row level security;
alter table public.game_score_records enable row level security;
alter table public.game_score_metric_definitions enable row level security;
alter table public.game_score_metric_values enable row level security;
alter table public.game_score_snapshots enable row level security;

create policy "Users can read sessions they created or joined"
  on public.game_sessions
  as permissive for select
  to authenticated
  using (
    created_by_user_id = (select auth.uid())
    or exists (
      select 1
      from public.game_session_participants p
      where p.game_session_id = game_sessions.id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Service role can manage game sessions"
  on public.game_sessions
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read participants for their sessions"
  on public.game_session_participants
  as permissive for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.game_session_participants mine
      where mine.game_session_id = game_session_participants.game_session_id
        and mine.user_id = (select auth.uid())
    )
  );

create policy "Service role can manage game participants"
  on public.game_session_participants
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Public can read leaderboard score records"
  on public.game_score_records
  as permissive for select
  to anon, authenticated
  using (game_key in ('fly-squasher', 'little-muncher'));

create policy "Users can read their own score records"
  on public.game_score_records
  as permissive for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.game_session_participants p
      where p.game_session_id = game_score_records.game_session_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Service role can manage score records"
  on public.game_score_records
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Public can read score metric definitions"
  on public.game_score_metric_definitions
  as permissive for select
  to anon, authenticated
  using (is_active);

create policy "Service role can manage score metric definitions"
  on public.game_score_metric_definitions
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read metric values for visible scores"
  on public.game_score_metric_values
  as permissive for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_score_records r
      where r.id = game_score_metric_values.score_record_id
        and (
          r.user_id = (select auth.uid())
          or r.game_key in ('fly-squasher', 'little-muncher')
          or exists (
            select 1
            from public.game_session_participants p
            where p.game_session_id = r.game_session_id
              and p.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "Service role can manage score metric values"
  on public.game_score_metric_values
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read snapshots for sessions they joined"
  on public.game_score_snapshots
  as permissive for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_session_participants p
      where p.game_session_id = game_score_snapshots.game_session_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Service role can manage score snapshots"
  on public.game_score_snapshots
  as permissive for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.game_sessions from anon;
revoke all on table public.game_sessions from authenticated;
revoke all on table public.game_session_participants from anon;
revoke all on table public.game_session_participants from authenticated;
revoke all on table public.game_score_records from anon;
revoke all on table public.game_score_records from authenticated;
revoke all on table public.game_score_metric_definitions from anon;
revoke all on table public.game_score_metric_definitions from authenticated;
revoke all on table public.game_score_metric_values from anon;
revoke all on table public.game_score_metric_values from authenticated;
revoke all on table public.game_score_snapshots from anon;
revoke all on table public.game_score_snapshots from authenticated;
revoke all on table public.game_leaderboard_scores from anon;
revoke all on table public.game_leaderboard_scores from authenticated;
revoke all on table public.fly_squasher_leaderboard from anon;
revoke all on table public.fly_squasher_leaderboard from authenticated;
revoke all on table public.little_muncher_leaderboard from anon;
revoke all on table public.little_muncher_leaderboard from authenticated;
revoke all on table public.game_score_records_full from anon;
revoke all on table public.game_score_records_full from authenticated;
revoke all on sequence public.game_session_participants_id_seq from anon;
revoke all on sequence public.game_session_participants_id_seq from authenticated;
revoke all on sequence public.game_score_records_id_seq from anon;
revoke all on sequence public.game_score_records_id_seq from authenticated;
revoke all on sequence public.game_score_metric_definitions_id_seq from anon;
revoke all on sequence public.game_score_metric_definitions_id_seq from authenticated;
revoke all on sequence public.game_score_metric_values_id_seq from anon;
revoke all on sequence public.game_score_metric_values_id_seq from authenticated;
revoke all on sequence public.game_score_snapshots_id_seq from anon;
revoke all on sequence public.game_score_snapshots_id_seq from authenticated;

grant select on table public.game_score_records to anon, authenticated;
grant select on table public.game_score_metric_definitions to anon, authenticated;
grant select on table public.game_leaderboard_scores to anon, authenticated;
grant select on table public.fly_squasher_leaderboard to anon, authenticated;
grant select on table public.little_muncher_leaderboard to anon, authenticated;
grant select on table public.game_sessions to authenticated;
grant select on table public.game_session_participants to authenticated;
grant select on table public.game_score_metric_values to authenticated;
grant select on table public.game_score_snapshots to authenticated;

grant select, insert, update, delete on table public.game_sessions to service_role;
grant select, insert, update, delete on table public.game_session_participants to service_role;
grant select, insert, update, delete on table public.game_score_records to service_role;
grant select, insert, update, delete on table public.game_score_metric_definitions to service_role;
grant select, insert, update, delete on table public.game_score_metric_values to service_role;
grant select, insert, update, delete on table public.game_score_snapshots to service_role;
grant select on table public.game_leaderboard_scores to service_role;
grant select on table public.fly_squasher_leaderboard to service_role;
grant select on table public.little_muncher_leaderboard to service_role;
grant select on table public.game_score_records_full to service_role;
grant execute on function public.refresh_game_score_records_full() to service_role;
grant usage, select on sequence public.game_session_participants_id_seq to service_role;
grant usage, select on sequence public.game_score_records_id_seq to service_role;
grant usage, select on sequence public.game_score_metric_definitions_id_seq to service_role;
grant usage, select on sequence public.game_score_metric_values_id_seq to service_role;
grant usage, select on sequence public.game_score_snapshots_id_seq to service_role;
