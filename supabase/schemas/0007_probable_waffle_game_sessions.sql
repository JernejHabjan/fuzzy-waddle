-- =============================================================================
-- 0007: Probable Waffle Game Sessions
-- =============================================================================
-- Tracks game sessions (online and offline) for score submission and match history.
--
-- Key fields:
--   scores_submitted    - set to true when the last human player submits all scores
--   scores_submitted_by - UUID of the player who submitted (idempotency tracking)
--   human_player_count  - used by clients to determine who is "last" to submit
--   session_state       - InProgress → ToScoreScreen → Completed / Abandoned
--
-- Multiplayer score submission strategy:
--   Only the last human player to reach the score screen submits scores.
--   API is idempotent: duplicate submissions return success without inserting again.
--
-- Depends on: 0001_profiles.sql, 0003_messages.sql (messages FK added here)
-- =============================================================================

drop table if exists probable_waffle_game_sessions cascade;

create table probable_waffle_game_sessions
(
  id                      uuid primary key default gen_random_uuid(),
  game_instance_id        uuid                     not null unique,
  game_type               text                     not null,
  map_id                  int                      not null,
  session_state           text                     not null,
  started_at              timestamp with time zone default now() not null,
  ended_at                timestamp with time zone null,
  total_duration_seconds  int                      null,
  created_by_user_id      uuid                     not null,
  scores_submitted        boolean                  not null default false,
  scores_submitted_by     uuid                     null,
  scores_submitted_at     timestamp with time zone null,
  human_player_count      int                      not null default 1,
  created_at              timestamp with time zone default now() not null
);

-- add foreign key constraint to the profiles table
alter table probable_waffle_game_sessions
  add constraint probable_waffle_game_sessions_created_by_user_id_fkey
  foreign key (created_by_user_id) references public.profiles (id);

-- add foreign key constraint for scores_submitted_by
alter table probable_waffle_game_sessions
  add constraint probable_waffle_game_sessions_scores_submitted_by_fkey
  foreign key (scores_submitted_by) references public.profiles (id);

-- add index on game_instance_id for efficient lookups
create unique index probable_waffle_game_sessions_game_instance_id_idx
  on probable_waffle_game_sessions (game_instance_id);

-- add index on started_at for efficient time-based queries
create index probable_waffle_game_sessions_started_at_idx
  on probable_waffle_game_sessions (started_at desc);

-- add index on created_by_user_id for user-specific queries
create index probable_waffle_game_sessions_created_by_user_id_idx
  on probable_waffle_game_sessions (created_by_user_id);

-- add index on session_state for filtering by state
create index probable_waffle_game_sessions_session_state_idx
  on probable_waffle_game_sessions (session_state);

-- RLS policies
drop policy if exists "Enable insert for service_role only" on probable_waffle_game_sessions;
create policy "Enable insert for service_role only" on probable_waffle_game_sessions
  as permissive for insert
  to service_role
  with check (true);

drop policy if exists "Enable update for service_role only" on probable_waffle_game_sessions;
create policy "Enable update for service_role only" on probable_waffle_game_sessions
  as permissive for update
  to service_role
  using (true);

drop policy if exists "Enable select for service_role" on probable_waffle_game_sessions;
create policy "Enable select for service_role" on probable_waffle_game_sessions
  as permissive for select
  to service_role
  using (true);

-- enable row level security
alter table probable_waffle_game_sessions
  enable row level security;

-- messages
-- add foreign key constraint to game sessions table
-- Note: This constraint requires probable_waffle_game_sessions table to exist first (run 0007 migration before this)
alter table messages
  add constraint messages_game_instance_id_fkey
    foreign key (game_instance_id) references probable_waffle_game_sessions (game_instance_id) on delete set null;

-- add comment explaining the relationship
comment on column messages.game_instance_id is 'References the game instance UUID from probable_waffle_game_sessions';

grant select, insert, update on table public.probable_waffle_game_sessions to service_role;


