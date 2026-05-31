-- =============================================================================
-- Probable Waffle Player Scores (Hybrid EAV Design)
-- =============================================================================
-- Stores per-player statistics for completed game sessions.
-- Uses a 3-table hybrid design (core fields + EAV metrics catalog + metric values).
--
-- Tables:
--   probable_waffle_player_scores        - core player info (result, score, faction…)
--   probable_waffle_score_metric_types   - metric catalog; add new metrics with INSERT only
--   probable_waffle_player_score_metrics - EAV values; only non-zero metrics stored
--
-- Materialized view (probable_waffle_player_scores_full):
--   Pivots EAV rows into columns for fast score-screen and history queries.
--   Refresh after bulk inserts: SELECT refresh_probable_waffle_player_scores_full();
--
-- Helper functions:
--   get_player_score_metrics(player_score_id)             → JSONB of all metrics
--   upsert_player_score_metric(id, metric_key, value)     → insert or update one metric
--
-- Stats view (probable_waffle_player_stats):
--   Aggregates per-user wins/losses/averages from the materialized view.
--
-- Depends on: probable_waffle_game_sessions.sql
-- =============================================================================

-- Create player scores table with hybrid design
-- Core metrics in main table, extended metrics in separate table for flexibility
drop table if exists probable_waffle_player_scores cascade;
drop table if exists probable_waffle_player_score_metrics cascade;
drop table if exists probable_waffle_score_metric_types cascade;

-- Main player scores table - contains only core/common fields
create table probable_waffle_player_scores
(
  id                    bigserial primary key,
  game_session_id       uuid                     not null,
  user_id               uuid                     null,
  player_number         int                      not null,
  player_name           text                     not null,
  player_type           text                     not null,
  team_number           int                      null,
  faction_type          text                     not null,
  game_result           text                     not null,
  eliminated            boolean                  not null default false,
  eliminated_at         timestamp with time zone null,
  final_score           int                      not null default 0,
  created_at            timestamp with time zone default now() not null
);

-- Metric types catalog - defines what metrics can be tracked
create table probable_waffle_score_metric_types
(
  id                    serial primary key,
  metric_key            text                     not null unique,
  metric_name           text                     not null,
  metric_category       text                     not null, -- 'units', 'buildings', 'resources', 'combat', 'economy'
  description           text                     null,
  display_order         int                      not null default 0,
  is_active             boolean                  not null default true,
  created_at            timestamp with time zone default now() not null
);

-- Individual metric values - flexible EAV pattern for extended metrics
create table probable_waffle_player_score_metrics
(
  id                    bigserial primary key,
  player_score_id       bigint                   not null,
  metric_type_id        int                      not null,
  metric_value          bigint                   not null default 0,
  created_at            timestamp with time zone default now() not null
);

-- Foreign key constraints
alter table probable_waffle_player_scores
  add constraint probable_waffle_player_scores_game_session_id_fkey
  foreign key (game_session_id) references probable_waffle_game_sessions (id) on delete cascade;

alter table probable_waffle_player_scores
  add constraint probable_waffle_player_scores_user_id_fkey
  foreign key (user_id) references public.profiles (id);

alter table probable_waffle_player_score_metrics
  add constraint probable_waffle_player_score_metrics_player_score_id_fkey
  foreign key (player_score_id) references probable_waffle_player_scores (id) on delete cascade;

alter table probable_waffle_player_score_metrics
  add constraint probable_waffle_player_score_metrics_metric_type_id_fkey
  foreign key (metric_type_id) references probable_waffle_score_metric_types (id);

-- Indexes on main table
create index probable_waffle_player_scores_user_id_idx
  on probable_waffle_player_scores (user_id)
  where user_id is not null;

create unique index probable_waffle_player_scores_session_player_idx
  on probable_waffle_player_scores (game_session_id, player_number);

-- Indexes on metrics table
create index probable_waffle_player_score_metrics_metric_type_id_idx
  on probable_waffle_player_score_metrics (metric_type_id);

-- Unique constraint: one value per metric per player score
create unique index probable_waffle_player_score_metrics_unique_idx
  on probable_waffle_player_score_metrics (player_score_id, metric_type_id);

-- RLS policies for main scores table
drop policy if exists "Enable insert for service_role only" on probable_waffle_player_scores;
create policy "Enable insert for service_role only" on probable_waffle_player_scores
  as permissive for insert
  to service_role
  with check (true);

drop policy if exists "Enable select for authenticated users" on probable_waffle_player_scores;
create policy "Enable select for authenticated users" on probable_waffle_player_scores
  as permissive for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from probable_waffle_player_scores other_ps
      where other_ps.game_session_id = probable_waffle_player_scores.game_session_id
        and other_ps.user_id = (select auth.uid())
    )
  );

drop policy if exists "Enable select for service_role" on probable_waffle_player_scores;
create policy "Enable select for service_role" on probable_waffle_player_scores
  as permissive for select
  to service_role
  using (true);

alter table probable_waffle_player_scores
  enable row level security;

-- RLS policies for metrics table
drop policy if exists "Enable insert for service_role only" on probable_waffle_player_score_metrics;
create policy "Enable insert for service_role only" on probable_waffle_player_score_metrics
  as permissive for insert
  to service_role
  with check (true);

drop policy if exists "Enable select for authenticated users" on probable_waffle_player_score_metrics;
create policy "Enable select for authenticated users" on probable_waffle_player_score_metrics
  as permissive for select
  to authenticated
  using (
    exists (
      select 1
      from probable_waffle_player_scores ps
      join probable_waffle_player_scores other_ps
        on other_ps.game_session_id = ps.game_session_id
           and other_ps.user_id = (select auth.uid())
      where ps.id = probable_waffle_player_score_metrics.player_score_id
    )
  );

drop policy if exists "Enable select for service_role" on probable_waffle_player_score_metrics;
create policy "Enable select for service_role" on probable_waffle_player_score_metrics
  as permissive for select
  to service_role
  using (true);

alter table probable_waffle_player_score_metrics
  enable row level security;

-- RLS policies for metric types table (read-only for all authenticated users)
drop policy if exists "Enable select for authenticated users" on probable_waffle_score_metric_types;
create policy "Enable select for authenticated users" on probable_waffle_score_metric_types
  as permissive for select
  to authenticated
  using (true);

drop policy if exists "Enable all for service_role" on probable_waffle_score_metric_types;
create policy "Enable all for service_role" on probable_waffle_score_metric_types
  as permissive for all
  to service_role
  using (true);

alter table probable_waffle_score_metric_types
  enable row level security;

-- Backfill game session access policy now that player scores exist
drop policy if exists "Enable select for authenticated users" on probable_waffle_game_sessions;
create policy "Enable select for authenticated users" on probable_waffle_game_sessions
  as permissive for select
  to authenticated
  using (
    (select auth.uid()) = created_by_user_id
    or exists (
      select 1
      from probable_waffle_player_scores ps
      where ps.game_session_id = probable_waffle_game_sessions.id
        and ps.user_id = (select auth.uid())
    )
  );

-- Match history view depends on both sessions and player scores
drop view if exists probable_waffle_match_history;
create view probable_waffle_match_history
  with (security_invoker=on)
as
select
  gs.id,
  gs.game_instance_id,
  gs.game_type,
  gs.map_id,
  gs.session_state,
  gs.started_at,
  gs.ended_at,
  gs.total_duration_seconds,
  gs.scores_submitted,
  gs.human_player_count,
  creator.name as created_by_name,
  submitter.name as submitted_by_name,
  (
    select json_agg(
      json_build_object(
        'player_number', ps.player_number,
        'player_name', ps.player_name,
        'player_type', ps.player_type,
        'faction_type', ps.faction_type,
        'game_result', ps.game_result,
        'final_score', ps.final_score,
        'is_current_user', ps.user_id = auth.uid()
      )
      order by ps.final_score desc
    )
    from probable_waffle_player_scores ps
    where ps.game_session_id = gs.id
  ) as players,
  exists(
    select 1
    from probable_waffle_player_scores ps
    where ps.game_session_id = gs.id
      and ps.user_id = auth.uid()
  ) as user_participated,
  (
    select ps.game_result
    from probable_waffle_player_scores ps
    where ps.game_session_id = gs.id
      and ps.user_id = auth.uid()
    limit 1
  ) as user_result
from probable_waffle_game_sessions gs
left join public.profiles creator on gs.created_by_user_id = creator.id
left join public.profiles submitter on gs.scores_submitted_by = submitter.id
where gs.scores_submitted = true
  and exists(
    select 1
    from probable_waffle_player_scores ps
    where ps.game_session_id = gs.id
      and ps.user_id = auth.uid()
  )
order by gs.ended_at desc nulls last, gs.started_at desc;

-- Insert predefined metric types
insert into probable_waffle_score_metric_types (metric_key, metric_name, metric_category, description, display_order) values
-- Units category
('units_produced', 'Units Produced', 'units', 'Total number of units created', 1),
('units_killed', 'Units Killed', 'units', 'Total enemy units destroyed', 2),
('units_lost', 'Units Lost', 'units', 'Total own units lost', 3),

-- Buildings category
('buildings_constructed', 'Buildings Constructed', 'buildings', 'Total buildings completed', 11),
('buildings_destroyed', 'Buildings Destroyed', 'buildings', 'Total enemy buildings destroyed', 12),
('buildings_lost', 'Buildings Lost', 'buildings', 'Total own buildings lost', 13),

-- Resources category
('resources_collected_minerals', 'Minerals Collected', 'resources', 'Total minerals gathered', 21),
('resources_collected_stone', 'Stone Collected', 'resources', 'Total stone gathered', 22),
('resources_collected_wood', 'Wood Collected', 'resources', 'Total wood gathered', 23),
('resources_spent_minerals', 'Minerals Spent', 'resources', 'Total minerals used', 24),
('resources_spent_stone', 'Stone Spent', 'resources', 'Total stone used', 25),
('resources_spent_wood', 'Wood Spent', 'resources', 'Total wood used', 26),
('final_resources_minerals', 'Final Minerals', 'resources', 'Minerals remaining at end', 27),
('final_resources_stone', 'Final Stone', 'resources', 'Stone remaining at end', 28),
('final_resources_wood', 'Final Wood', 'resources', 'Wood remaining at end', 29),

-- Combat category
('damage_dealt', 'Damage Dealt', 'combat', 'Total damage inflicted', 31),
('damage_received', 'Damage Received', 'combat', 'Total damage taken', 32),
('healing_done', 'Healing Done', 'combat', 'Total healing provided', 33),

-- Economy category
('max_army_size', 'Max Army Size', 'economy', 'Peak unit count achieved', 41),
('max_building_count', 'Max Building Count', 'economy', 'Peak building count achieved', 42);

-- Create materialized view for efficient querying with all metrics pivoted
drop materialized view if exists probable_waffle_player_scores_full;
create materialized view probable_waffle_player_scores_full as
select
  ps.id,
  ps.game_session_id,
  ps.user_id,
  ps.player_number,
  ps.player_name,
  ps.player_type,
  ps.team_number,
  ps.faction_type,
  ps.game_result,
  ps.eliminated,
  ps.eliminated_at,
  ps.final_score,
  ps.created_at,
  -- Pivot metrics into columns
  max(case when mt.metric_key = 'units_produced' then m.metric_value else 0 end) as units_produced,
  max(case when mt.metric_key = 'units_killed' then m.metric_value else 0 end) as units_killed,
  max(case when mt.metric_key = 'units_lost' then m.metric_value else 0 end) as units_lost,
  max(case when mt.metric_key = 'buildings_constructed' then m.metric_value else 0 end) as buildings_constructed,
  max(case when mt.metric_key = 'buildings_destroyed' then m.metric_value else 0 end) as buildings_destroyed,
  max(case when mt.metric_key = 'buildings_lost' then m.metric_value else 0 end) as buildings_lost,
  max(case when mt.metric_key = 'resources_collected_minerals' then m.metric_value else 0 end) as resources_collected_minerals,
  max(case when mt.metric_key = 'resources_collected_stone' then m.metric_value else 0 end) as resources_collected_stone,
  max(case when mt.metric_key = 'resources_collected_wood' then m.metric_value else 0 end) as resources_collected_wood,
  max(case when mt.metric_key = 'resources_spent_minerals' then m.metric_value else 0 end) as resources_spent_minerals,
  max(case when mt.metric_key = 'resources_spent_stone' then m.metric_value else 0 end) as resources_spent_stone,
  max(case when mt.metric_key = 'resources_spent_wood' then m.metric_value else 0 end) as resources_spent_wood,
  max(case when mt.metric_key = 'final_resources_minerals' then m.metric_value else 0 end) as final_resources_minerals,
  max(case when mt.metric_key = 'final_resources_stone' then m.metric_value else 0 end) as final_resources_stone,
  max(case when mt.metric_key = 'final_resources_wood' then m.metric_value else 0 end) as final_resources_wood,
  max(case when mt.metric_key = 'damage_dealt' then m.metric_value else 0 end) as damage_dealt,
  max(case when mt.metric_key = 'damage_received' then m.metric_value else 0 end) as damage_received,
  max(case when mt.metric_key = 'healing_done' then m.metric_value else 0 end) as healing_done,
  max(case when mt.metric_key = 'max_army_size' then m.metric_value else 0 end) as max_army_size,
  max(case when mt.metric_key = 'max_building_count' then m.metric_value else 0 end) as max_building_count
from probable_waffle_player_scores ps
left join probable_waffle_player_score_metrics m on ps.id = m.player_score_id
left join probable_waffle_score_metric_types mt on m.metric_type_id = mt.id
group by ps.id, ps.game_session_id, ps.user_id, ps.player_number, ps.player_name,
         ps.player_type, ps.team_number, ps.faction_type, ps.game_result,
         ps.eliminated, ps.eliminated_at, ps.final_score, ps.created_at;

-- Index on materialized view
create unique index probable_waffle_player_scores_full_id_idx on probable_waffle_player_scores_full (id);

revoke all on table public.probable_waffle_player_scores_full from public;
revoke all on table public.probable_waffle_player_scores_full from anon;
revoke all on table public.probable_waffle_player_scores_full from authenticated;

-- Create view for player statistics aggregation (uses materialized view for performance)
drop view if exists probable_waffle_player_stats;
create view probable_waffle_player_stats
  with (security_invoker=on)
as
select
  ps.user_id,
  p.name as player_name,
  count(*) as total_games,
  count(*) filter (where ps.game_result = 'win') as wins,
  count(*) filter (where ps.game_result = 'loss') as losses,
  count(*) filter (where ps.game_result = 'tie') as ties,
  round(
    (count(*) filter (where ps.game_result = 'win')::decimal /
     nullif(count(*) filter (where ps.game_result != 'quit'), 0)) * 100,
    2
  ) as win_rate_percentage,
  sum(ps.units_produced) as total_units_produced,
  sum(ps.units_killed) as total_units_killed,
  sum(ps.buildings_constructed) as total_buildings_constructed,
  sum(ps.buildings_destroyed) as total_buildings_destroyed,
  avg(ps.final_score)::int as avg_final_score,
  max(ps.final_score) as max_final_score
from probable_waffle_player_scores_full ps
left join public.profiles p on ps.user_id = p.id
where ps.user_id is not null
group by ps.user_id, p.name;

-- 1. Refresh Function
CREATE OR REPLACE FUNCTION refresh_probable_waffle_player_scores_full()
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY probable_waffle_player_scores_full;
END;
$$;

revoke all on table public.probable_waffle_player_scores from anon;
revoke all on table public.probable_waffle_player_scores from authenticated;
revoke all on table public.probable_waffle_score_metric_types from anon;
revoke all on table public.probable_waffle_score_metric_types from authenticated;
revoke all on table public.probable_waffle_player_score_metrics from anon;
revoke all on table public.probable_waffle_player_score_metrics from authenticated;
revoke all on table public.probable_waffle_match_history from anon;
revoke all on table public.probable_waffle_match_history from authenticated;
revoke all on table public.probable_waffle_player_stats from anon;
revoke all on table public.probable_waffle_player_stats from authenticated;
revoke all on sequence public.probable_waffle_player_scores_id_seq from anon;
revoke all on sequence public.probable_waffle_player_scores_id_seq from authenticated;
revoke all on sequence public.probable_waffle_player_score_metrics_id_seq from anon;
revoke all on sequence public.probable_waffle_player_score_metrics_id_seq from authenticated;

grant select, insert on table public.probable_waffle_player_scores to service_role;
grant select on table public.probable_waffle_score_metric_types to service_role;
grant select, insert on table public.probable_waffle_player_score_metrics to service_role;
grant select on table public.probable_waffle_player_scores_full to service_role;
grant execute on function public.refresh_probable_waffle_player_scores_full() to service_role;
grant usage, select on sequence public.probable_waffle_player_scores_id_seq to service_role;
grant usage, select on sequence public.probable_waffle_player_score_metrics_id_seq to service_role;

-- 2. Get Metrics Helper
CREATE OR REPLACE FUNCTION get_player_score_metrics(p_player_score_id bigint)
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SET search_path = public, pg_temp
AS $$
SELECT jsonb_object_agg(mt.metric_key, m.metric_value)
FROM probable_waffle_player_score_metrics m
       JOIN probable_waffle_score_metric_types mt ON m.metric_type_id = mt.id
WHERE m.player_score_id = p_player_score_id;
$$;

-- 3. Upsert Metric Helper
CREATE OR REPLACE FUNCTION upsert_player_score_metric(
  p_player_score_id bigint,
  p_metric_key text,
  p_metric_value bigint
)
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public, pg_temp
AS $$
DECLARE
  v_metric_type_id int;
BEGIN
  -- Get metric type ID
  SELECT id INTO v_metric_type_id
  FROM probable_waffle_score_metric_types
  WHERE metric_key = p_metric_key;

  IF v_metric_type_id IS NULL THEN
    RAISE EXCEPTION 'Metric type % does not exist', p_metric_key;
  END IF;

  -- Upsert metric value
  INSERT INTO probable_waffle_player_score_metrics (player_score_id, metric_type_id, metric_value)
  VALUES (p_player_score_id, v_metric_type_id, p_metric_value)
  ON CONFLICT (player_score_id, metric_type_id)
    DO UPDATE SET metric_value = EXCLUDED.metric_value;
END;
$$;

