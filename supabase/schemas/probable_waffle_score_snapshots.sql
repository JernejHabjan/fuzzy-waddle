-- Score snapshots for timeline charts in match history
drop table if exists probable_waffle_score_snapshots cascade;

create table probable_waffle_score_snapshots
(
  id              bigserial primary key,
  game_session_id uuid                     not null,
  snapshots       jsonb                    not null, -- Array of {timestamp_ms, playerScores[]}
  created_at      timestamp with time zone default now() not null
);

alter table probable_waffle_score_snapshots
  add constraint probable_waffle_score_snapshots_game_session_id_fkey
  foreign key (game_session_id) references probable_waffle_game_sessions (id) on delete cascade;

create unique index probable_waffle_score_snapshots_game_session_id_idx
  on probable_waffle_score_snapshots (game_session_id);

-- RLS: only service_role may insert; authenticated users may read
drop policy if exists "Enable insert for service_role only" on probable_waffle_score_snapshots;
create policy "Enable insert for service_role only" on probable_waffle_score_snapshots
  as permissive for insert
  to service_role
  with check (true);

drop policy if exists "Enable select for authenticated users" on probable_waffle_score_snapshots;
create policy "Enable select for authenticated users" on probable_waffle_score_snapshots
  as permissive for select
  to authenticated
  using (
    exists (
      select 1
      from probable_waffle_player_scores ps
      where ps.game_session_id = probable_waffle_score_snapshots.game_session_id
        and ps.user_id = (select auth.uid())
    )
  );

drop policy if exists "Enable select for service_role" on probable_waffle_score_snapshots;
create policy "Enable select for service_role" on probable_waffle_score_snapshots
  as permissive for select
  to service_role
  using (true);

alter table probable_waffle_score_snapshots
  enable row level security;

revoke all on table public.probable_waffle_score_snapshots from anon;
revoke all on table public.probable_waffle_score_snapshots from authenticated;
revoke all on sequence public.probable_waffle_score_snapshots_id_seq from anon;
revoke all on sequence public.probable_waffle_score_snapshots_id_seq from authenticated;

grant select, insert on table public.probable_waffle_score_snapshots to service_role;
grant usage, select on sequence public.probable_waffle_score_snapshots_id_seq to service_role;
