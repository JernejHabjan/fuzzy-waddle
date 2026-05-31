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

grant select, insert, update, delete on table public.chat_channels to service_role;
grant select, insert, update, delete on table public.chat_channel_memberships to service_role;
grant select, insert, update, delete on table public.chat_messages to service_role;
grant select, insert, update, delete on table public.chat_message_reports to service_role;
grant usage, select on sequence public.chat_messages_id_seq to service_role;
grant usage, select on sequence public.chat_channel_memberships_id_seq to service_role;
grant usage, select on sequence public.chat_message_reports_id_seq to service_role;
