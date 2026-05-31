-- Source: 0001_user_profiles.sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();
drop table if exists public.user_profiles cascade;
drop type if exists public.user_account_status cascade;

create type public.user_account_status as enum ('active', 'limited', 'disabled');

create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;

create table public.user_profiles
(
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text not null,
  username       text null,
  avatar_url     text null,
  bio            text null,
  locale         text null,
  timezone       text null,
  website_url    text null,
  account_status public.user_account_status not null default 'active',
  created_at     timestamp with time zone not null default now(),
  updated_at     timestamp with time zone not null default now(),
  constraint user_profiles_display_name_not_blank check (length(btrim(display_name)) > 0),
  constraint user_profiles_username_format check (
    username is null
    or username ~ '^[a-z0-9_][a-z0-9_-]{2,29}$'
  )
);

create unique index user_profiles_username_unique_idx
  on public.user_profiles (lower(username))
  where username is not null;

create index user_profiles_account_status_idx
  on public.user_profiles (account_status);

create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row
execute function public.set_updated_at();

alter table public.user_profiles
  enable row level security;

create policy "Users can read active public profiles"
  on public.user_profiles
  as permissive for select
  to anon, authenticated
  using (account_status = 'active');

create policy "Users can update their own profile"
  on public.user_profiles
  as permissive for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Service role can manage profiles"
  on public.user_profiles
  as permissive for all
  to service_role
  using (true)
  with check (true);

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  generated_name text;
begin
  generated_name := coalesce(
    nullif(btrim(metadata ->> 'full_name'), ''),
    nullif(btrim(metadata ->> 'name'), ''),
    nullif(btrim(metadata ->> 'user_name'), ''),
    nullif(btrim(metadata ->> 'preferred_username'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Player ' || substr(replace(new.id::text, '-', ''), 1, 8)
  );

  insert into public.user_profiles (
    id,
    display_name,
    avatar_url,
    locale
  )
  values (
    new.id,
    generated_name,
    coalesce(nullif(metadata ->> 'avatar_url', ''), nullif(metadata ->> 'picture', '')),
    nullif(metadata ->> 'locale', '')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = coalesce(public.user_profiles.avatar_url, excluded.avatar_url),
        locale = coalesce(public.user_profiles.locale, excluded.locale);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
execute function public.handle_new_user();

insert into public.user_profiles (id, display_name, avatar_url, locale, created_at, updated_at)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'user_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'preferred_username'), ''),
    nullif(split_part(u.email, '@', 1), ''),
    'Player ' || substr(replace(u.id::text, '-', ''), 1, 8)
  ),
  coalesce(nullif(u.raw_user_meta_data ->> 'avatar_url', ''), nullif(u.raw_user_meta_data ->> 'picture', '')),
  nullif(u.raw_user_meta_data ->> 'locale', ''),
  coalesce(u.created_at, now()),
  now()
from auth.users u
on conflict (id) do nothing;

revoke all on table public.user_profiles from anon;
revoke all on table public.user_profiles from authenticated;

grant select (id, display_name, username, avatar_url, bio, locale, timezone, website_url, account_status, created_at, updated_at)
  on table public.user_profiles to anon, authenticated;
grant update (display_name, username, avatar_url, bio, locale, timezone, website_url)
  on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.user_profiles to service_role;

-- Source: 0002_storage.sql
CREATE POLICY "test bucket access to authenticated users for webp files"
  ON storage.objects FOR SELECT USING (
  -- restrict bucket
  bucket_id = 'test-bucket'
    AND auth.role() = 'authenticated'
    -- allow access to only webp file
    AND storage."extension"(name) = 'webp'
  );

-- Source: 0003_chat.sql
drop table if exists public.chat_message_reports cascade;
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_channel_memberships cascade;
drop table if exists public.chat_channels cascade;
drop type if exists public.chat_report_status cascade;
drop type if exists public.chat_report_reason cascade;
drop type if exists public.chat_message_status cascade;
drop type if exists public.chat_membership_role cascade;
drop type if exists public.chat_channel_type cascade;

create type public.chat_channel_type as enum ('global_lobby', 'game_lobby', 'game_session', 'direct', 'system');
create type public.chat_membership_role as enum ('owner', 'moderator', 'member');
create type public.chat_message_status as enum ('visible', 'hidden', 'deleted');
create type public.chat_report_reason as enum ('spam', 'abuse', 'harassment', 'hate_speech', 'cheating', 'personal_information', 'other');
create type public.chat_report_status as enum ('open', 'reviewed', 'dismissed', 'actioned');

create table public.chat_channels
(
  id                  uuid primary key default gen_random_uuid(),
  channel_type        public.chat_channel_type not null,
  game_key            text null,
  external_session_id uuid null,
  title               text null,
  metadata            jsonb not null default '{}'::jsonb,
  created_by_user_id  uuid null references public.user_profiles (id) on delete set null,
  archived_at         timestamp with time zone null,
  created_at          timestamp with time zone not null default now(),
  updated_at          timestamp with time zone not null default now(),
  constraint chat_channels_context_check check (
    (channel_type = 'global_lobby' and game_key is null and external_session_id is null)
    or (channel_type = 'game_lobby' and game_key is not null and external_session_id is null)
    or (channel_type = 'game_session' and game_key is not null and external_session_id is not null)
    or (channel_type in ('direct', 'system'))
  )
);

create unique index chat_channels_global_lobby_unique_idx
  on public.chat_channels ((channel_type))
  where channel_type = 'global_lobby';

create unique index chat_channels_game_lobby_unique_idx
  on public.chat_channels (game_key)
  where channel_type = 'game_lobby';

create unique index chat_channels_game_session_unique_idx
  on public.chat_channels (game_key, external_session_id)
  where channel_type = 'game_session';

create index chat_channels_lookup_idx
  on public.chat_channels (channel_type, game_key, external_session_id);

create trigger chat_channels_set_updated_at
  before update on public.chat_channels
  for each row
execute function public.set_updated_at();

create table public.chat_channel_memberships
(
  id              bigserial primary key,
  channel_id      uuid not null references public.chat_channels (id) on delete cascade,
  user_id         uuid not null references public.user_profiles (id) on delete cascade,
  membership_role public.chat_membership_role not null default 'member',
  last_read_at    timestamp with time zone null,
  muted_until     timestamp with time zone null,
  joined_at       timestamp with time zone not null default now(),
  left_at         timestamp with time zone null,
  constraint chat_channel_memberships_join_leave_check check (left_at is null or left_at >= joined_at)
);

create unique index chat_channel_memberships_channel_user_idx
  on public.chat_channel_memberships (channel_id, user_id);

create index chat_channel_memberships_user_id_idx
  on public.chat_channel_memberships (user_id);

create table public.chat_messages
(
  id                  bigserial primary key,
  channel_id          uuid not null references public.chat_channels (id) on delete cascade,
  sender_user_id      uuid null references public.user_profiles (id) on delete set null,
  body                text not null,
  message_status      public.chat_message_status not null default 'visible',
  moderation_reason   text null,
  reply_to_message_id bigint null references public.chat_messages (id) on delete set null,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamp with time zone not null default now(),
  edited_at           timestamp with time zone null,
  deleted_at          timestamp with time zone null,
  constraint chat_messages_body_not_blank check (length(btrim(body)) > 0)
);

create index chat_messages_channel_created_idx
  on public.chat_messages (channel_id, created_at desc);

create index chat_messages_sender_user_id_idx
  on public.chat_messages (sender_user_id)
  where sender_user_id is not null;

create table public.chat_message_reports
(
  id               bigserial primary key,
  message_id       bigint not null references public.chat_messages (id) on delete cascade,
  reporter_user_id uuid not null references public.user_profiles (id) on delete cascade,
  reason           public.chat_report_reason not null,
  details          text null,
  report_status    public.chat_report_status not null default 'open',
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamp with time zone not null default now(),
  reviewed_at      timestamp with time zone null,
  reviewed_by      uuid null references public.user_profiles (id) on delete set null,
  constraint chat_message_reports_details_length_check check (details is null or length(details) <= 1000),
  constraint chat_message_reports_review_state_check check (
    (report_status = 'open' and reviewed_at is null and reviewed_by is null)
    or (report_status <> 'open' and reviewed_at is not null)
  )
);

create unique index chat_message_reports_message_reporter_idx
  on public.chat_message_reports (message_id, reporter_user_id);

create index chat_message_reports_status_created_idx
  on public.chat_message_reports (report_status, created_at desc);

insert into public.chat_channels (channel_type, title)
values ('global_lobby', 'Global Lobby')
on conflict do nothing;

alter table public.chat_channels enable row level security;
alter table public.chat_channel_memberships enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_message_reports enable row level security;

create policy "Public can read open lobby channels"
  on public.chat_channels
  as permissive for select
  to anon, authenticated
  using (archived_at is null and channel_type in ('global_lobby', 'game_lobby'));

create policy "Authenticated users can read session channels"
  on public.chat_channels
  as permissive for select
  to authenticated
  using (archived_at is null and channel_type = 'game_session');

create policy "Service role can manage chat channels"
  on public.chat_channels
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read their own memberships"
  on public.chat_channel_memberships
  as permissive for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can update their own membership read state"
  on public.chat_channel_memberships
  as permissive for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Service role can manage chat memberships"
  on public.chat_channel_memberships
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read visible lobby messages"
  on public.chat_messages
  as permissive for select
  to anon, authenticated
  using (
    message_status = 'visible'
    and exists (
      select 1
      from public.chat_channels c
      where c.id = chat_messages.channel_id
        and c.archived_at is null
        and c.channel_type in ('global_lobby', 'game_lobby')
    )
  );

create policy "Authenticated users can read visible session messages"
  on public.chat_messages
  as permissive for select
  to authenticated
  using (
    message_status = 'visible'
    and exists (
      select 1
      from public.chat_channels c
      where c.id = chat_messages.channel_id
        and c.archived_at is null
        and c.channel_type = 'game_session'
    )
  );

create policy "Service role can manage chat messages"
  on public.chat_messages
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Service role can manage message reports"
  on public.chat_message_reports
  as permissive for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.chat_channels from anon;
revoke all on table public.chat_channels from authenticated;
revoke all on table public.chat_channel_memberships from anon;
revoke all on table public.chat_channel_memberships from authenticated;
revoke all on table public.chat_messages from anon;
revoke all on table public.chat_messages from authenticated;
revoke all on table public.chat_message_reports from anon;
revoke all on table public.chat_message_reports from authenticated;
revoke all on sequence public.chat_messages_id_seq from anon;
revoke all on sequence public.chat_messages_id_seq from authenticated;
revoke all on sequence public.chat_channel_memberships_id_seq from anon;
revoke all on sequence public.chat_channel_memberships_id_seq from authenticated;
revoke all on sequence public.chat_message_reports_id_seq from anon;
revoke all on sequence public.chat_message_reports_id_seq from authenticated;

grant select on table public.chat_channels to anon, authenticated;
grant select on table public.chat_messages to anon, authenticated;
grant select on table public.chat_channel_memberships to authenticated;
grant update (last_read_at, muted_until, left_at) on table public.chat_channel_memberships to authenticated;

grant select, insert, update, delete on table public.chat_channels to service_role;
grant select, insert, update, delete on table public.chat_channel_memberships to service_role;
grant select, insert, update, delete on table public.chat_messages to service_role;
grant select, insert, update, delete on table public.chat_message_reports to service_role;
grant usage, select on sequence public.chat_messages_id_seq to service_role;
grant usage, select on sequence public.chat_channel_memberships_id_seq to service_role;
grant usage, select on sequence public.chat_message_reports_id_seq to service_role;

-- Source: 0004_game_sessions_and_scores.sql
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

-- Source: 0005_achievements.sql
drop table if exists public.user_achievement_unlocks cascade;
drop table if exists public.achievement_definitions cascade;
drop type if exists public.achievement_difficulty cascade;

create type public.achievement_difficulty as enum ('easy', 'medium', 'hard');

create table public.achievement_definitions
(
  id            text primary key,
  game_key      text not null,
  name          text not null,
  description   text not null,
  category      text null,
  difficulty    public.achievement_difficulty null,
  image_key     text null,
  is_secret     boolean not null default false,
  is_active     boolean not null default true,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamp with time zone not null default now(),
  updated_at    timestamp with time zone not null default now(),
  constraint achievement_definitions_game_key_not_blank check (length(btrim(game_key)) > 0)
);

create index achievement_definitions_game_key_idx
  on public.achievement_definitions (game_key, is_active);

create trigger achievement_definitions_set_updated_at
  before update on public.achievement_definitions
  for each row
execute function public.set_updated_at();

create table public.user_achievement_unlocks
(
  id             bigserial primary key,
  achievement_id text not null references public.achievement_definitions (id) on delete cascade,
  user_id        uuid not null references public.user_profiles (id) on delete cascade,
  unlocked_at    timestamp with time zone not null default now(),
  metadata       jsonb not null default '{}'::jsonb
);

create unique index user_achievement_unlocks_user_achievement_idx
  on public.user_achievement_unlocks (user_id, achievement_id);

create index user_achievement_unlocks_user_id_idx
  on public.user_achievement_unlocks (user_id);

insert into public.achievement_definitions (id, game_key, name, description, category, difficulty, image_key, is_secret) values
('first_steps', 'probable-waffle', 'First Steps', 'Complete the tutorial.', 'Progression', 'easy', 'actor_info_icons/element.png', false),
('campaigner', 'probable-waffle', 'Campaigner', 'Complete the first campaign mission.', 'Progression', 'easy', 'actor_info_icons/element.png', false),
('war_hero', 'probable-waffle', 'War Hero', 'Complete the entire campaign.', 'Progression', 'hard', 'actor_info_icons/element.png', false),
('first_victory', 'probable-waffle', 'First Victory', 'Win your first skirmish or multiplayer game.', 'Milestones', 'easy', 'actor_info_icons/element.png', false),
('the_architect', 'probable-waffle', 'The Architect', 'Construct one of every building type in a single match.', 'Milestones', 'medium', 'actor_info_icons/element.png', false),
('unit_collector', 'probable-waffle', 'Unit Collector', 'Train one of every unit type in a single match.', 'Milestones', 'medium', 'actor_info_icons/element.png', false),
('hundred_wins', 'probable-waffle', 'Centurion', 'Achieve 100 victories.', 'Milestones', 'hard', 'actor_info_icons/element.png', false),
('resourceful', 'probable-waffle', 'Resourceful', 'Gather 10,000 resources in a single game.', 'Economy', 'easy', 'actor_info_icons/element.png', false),
('master_economist', 'probable-waffle', 'Master Economist', 'End a match with over 50,000 resources in the bank.', 'Economy', 'medium', 'actor_info_icons/element.png', false),
('economic_powerhouse', 'probable-waffle', 'Economic Powerhouse', 'Win a game with double the resource income of all opponents.', 'Economy', 'hard', 'actor_info_icons/element.png', false),
('annihilator', 'probable-waffle', 'Annihilator', 'Destroy 1,000 enemy units across all games.', 'Military', 'medium', 'actor_info_icons/element.png', false),
('unstoppable_force', 'probable-waffle', 'Unstoppable Force', 'Build an army that reaches the maximum supply limit.', 'Military', 'medium', 'actor_info_icons/element.png', false),
('swift_victory', 'probable-waffle', 'Swift Victory', 'Win a game in under 10 minutes.', 'Military', 'medium', 'actor_info_icons/element.png', false),
('comeback_king', 'probable-waffle', 'Comeback King', 'Win a game after your main command center has been destroyed.', 'Military', 'hard', 'actor_info_icons/element.png', false),
('scouts_honor', 'probable-waffle', 'Scout''s Honor', 'Reveal the entire map in a single game.', 'Challenge', 'easy', 'actor_info_icons/element.png', false),
('no_fly_zone', 'probable-waffle', 'No-Fly Zone', 'Destroy 50 enemy air units in a single game.', 'Challenge', 'medium', 'actor_info_icons/element.png', false),
('death_from_above', 'probable-waffle', 'Death From Above', 'Win a game by only building air units (and necessary tech buildings).', 'Challenge', 'hard', 'actor_info_icons/element.png', false),
('turtle_power', 'probable-waffle', 'Turtle Power', 'Win a game that lasts longer than one hour.', 'Challenge', 'medium', 'actor_info_icons/element.png', false),
('master_tactician', 'probable-waffle', 'Master Tactician', 'Win a game without losing a single unit.', 'Secret', 'hard', 'actor_info_icons/element.png', true),
('click_happy', 'probable-waffle', 'Click Happy', 'Click on a single unit 50 times in a row.', 'Secret', 'easy', 'actor_info_icons/element.png', true)
on conflict (id) do nothing;

alter table public.achievement_definitions enable row level security;
alter table public.user_achievement_unlocks enable row level security;

create policy "Public can read active achievement definitions"
  on public.achievement_definitions
  as permissive for select
  to anon, authenticated
  using (is_active);

create policy "Service role can manage achievement definitions"
  on public.achievement_definitions
  as permissive for all
  to service_role
  using (true)
  with check (true);

create policy "Users can read their own achievement unlocks"
  on public.user_achievement_unlocks
  as permissive for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert their own achievement unlocks"
  on public.user_achievement_unlocks
  as permissive for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Service role can manage achievement unlocks"
  on public.user_achievement_unlocks
  as permissive for all
  to service_role
  using (true)
  with check (true);

revoke all on table public.achievement_definitions from anon;
revoke all on table public.achievement_definitions from authenticated;
revoke all on table public.user_achievement_unlocks from anon;
revoke all on table public.user_achievement_unlocks from authenticated;
revoke all on sequence public.user_achievement_unlocks_id_seq from anon;
revoke all on sequence public.user_achievement_unlocks_id_seq from authenticated;

grant select on table public.achievement_definitions to anon, authenticated;
grant select, insert on table public.user_achievement_unlocks to authenticated;
grant usage on sequence public.user_achievement_unlocks_id_seq to authenticated;

grant select, insert, update, delete on table public.achievement_definitions to service_role;
grant select, insert, update, delete on table public.user_achievement_unlocks to service_role;
grant usage, select on sequence public.user_achievement_unlocks_id_seq to service_role;
