-- Social relationship workflow:
--
-- authenticated HTTP intent -> guarded service-role RPC -> lock canonical pair
--   -> validate active users + blocks -> mutate friendship/block rows -> return projection
--
-- Parties and matchmaking consume these stable user relationships in later stages. This schema
-- deliberately contains no team-size assumptions so FFA, 2v2, 3v3, and 4v4 can share it.

create type public.friend_relationship_status as enum ('pending', 'accepted');
create type public.social_friend_action as enum (
  'send_request',
  'accept_request',
  'decline_request',
  'cancel_request',
  'remove_friend',
  'block',
  'unblock'
);

comment on type public.friend_relationship_status is
  'Durable lifecycle of a mutual friendship. Declined, cancelled, and removed relationships are deleted.';
comment on type public.social_friend_action is
  'Closed set of guarded social mutations accepted by the transactional social RPC.';

create table public.friend_relationships (
  id uuid primary key default gen_random_uuid(),
  user_low_id uuid not null references public.user_profiles(id) on delete cascade,
  user_high_id uuid not null references public.user_profiles(id) on delete cascade,
  requester_id uuid not null references public.user_profiles(id) on delete cascade,
  status public.friend_relationship_status not null default 'pending',
  accepted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_relationships_canonical_pair check (user_low_id < user_high_id),
  constraint friend_relationships_requester_in_pair check (requester_id in (user_low_id, user_high_id)),
  constraint friend_relationships_acceptance_time check (
    (status = 'pending' and accepted_at is null)
    or (status = 'accepted' and accepted_at is not null)
  ),
  constraint friend_relationships_pair_unique unique (user_low_id, user_high_id)
);

create table public.user_blocks (
  blocker_id uuid not null references public.user_profiles(id) on delete cascade,
  blocked_user_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_user_id)
);

comment on table public.friend_relationships is
  'One canonical ordered row per user pair, with the requester retained while pending and mutual status after acceptance.';
comment on column public.friend_relationships.user_low_id is 'Lexicographically lower user UUID in the canonical pair.';
comment on column public.friend_relationships.user_high_id is 'Lexicographically higher user UUID in the canonical pair.';
comment on column public.friend_relationships.requester_id is 'User who created the pending request; retained for audit after acceptance.';
comment on column public.friend_relationships.accepted_at is 'Time at which the receiver accepted or a crossed request auto-accepted.';
comment on table public.user_blocks is
  'Directional privacy and safety boundary. A block removes friendship and suppresses discovery in both directions.';

create index friend_relationships_low_user_idx on public.friend_relationships(user_low_id, status);
create index friend_relationships_high_user_idx on public.friend_relationships(user_high_id, status);
create index friend_relationships_requester_idx on public.friend_relationships(requester_id, status);
create index user_blocks_blocked_user_idx on public.user_blocks(blocked_user_id);

create trigger friend_relationships_set_updated_at
  before update on public.friend_relationships
  for each row execute function public.set_updated_at();

alter table public.friend_relationships enable row level security;
alter table public.user_blocks enable row level security;

create policy "Users can read their own friendships"
  on public.friend_relationships for select to authenticated
  using ((select auth.uid()) in (user_low_id, user_high_id));
create policy "Users can read blocks they created"
  on public.user_blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);
create policy "Service role manages friendships"
  on public.friend_relationships for all to service_role using (true) with check (true);
create policy "Service role manages blocks"
  on public.user_blocks for all to service_role using (true) with check (true);

comment on policy "Users can read their own friendships" on public.friend_relationships is
  'A user can inspect only relationships in which they participate; all mutations remain server-owned.';
comment on policy "Users can read blocks they created" on public.user_blocks is
  'A user can manage their own safety list without learning who has blocked them.';

revoke all on table public.friend_relationships from anon, authenticated;
revoke all on table public.user_blocks from anon, authenticated;
grant select on table public.friend_relationships to authenticated;
grant select on table public.user_blocks to authenticated;
grant select, insert, update, delete on table public.friend_relationships to service_role;
grant select, insert, update, delete on table public.user_blocks to service_role;

create function public.social_assert_active_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_profiles
    where id = p_user_id and account_status = 'active'
      and (banned_until is null or banned_until <= now())
  ) then
    raise exception 'social_user_unavailable' using errcode = 'P0001';
  end if;
end;
$$;

create function public.social_relationship_projection(p_relationship_id uuid, p_actor_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  relationship public.friend_relationships%rowtype;
  other_profile public.user_profiles%rowtype;
  other_user_id uuid;
  direction text;
begin
  select * into relationship from public.friend_relationships where id = p_relationship_id;
  if relationship.id is null or p_actor_user_id not in (relationship.user_low_id, relationship.user_high_id) then
    return null;
  end if;

  other_user_id := case when relationship.user_low_id = p_actor_user_id
    then relationship.user_high_id else relationship.user_low_id end;
  select * into other_profile from public.user_profiles where id = other_user_id;
  direction := case
    when relationship.status = 'accepted' then 'friend'
    when relationship.requester_id = p_actor_user_id then 'outbound'
    else 'inbound'
  end;

  return jsonb_build_object(
    'id', relationship.id,
    'status', relationship.status,
    'direction', direction,
    'requesterId', relationship.requester_id,
    'createdAt', relationship.created_at,
    'updatedAt', relationship.updated_at,
    'acceptedAt', relationship.accepted_at,
    'user', jsonb_build_object(
      'id', other_profile.id,
      'username', other_profile.username,
      'displayName', other_profile.display_name,
      'avatarUrl', other_profile.avatar_url
    )
  );
end;
$$;

create function public.social_find_user_by_username(p_actor_user_id uuid, p_username text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.user_profiles%rowtype;
begin
  perform public.social_assert_active_user(p_actor_user_id);
  select * into profile
  from public.user_profiles
  where username is not null
    and lower(username) = lower(btrim(p_username))
    and account_status = 'active'
    and (banned_until is null or banned_until <= now())
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = p_actor_user_id and b.blocked_user_id = user_profiles.id)
         or (b.blocker_id = user_profiles.id and b.blocked_user_id = p_actor_user_id)
    )
  limit 1;

  if profile.id is null then return null; end if;
  return jsonb_build_object(
    'id', profile.id,
    'username', profile.username,
    'displayName', profile.display_name,
    'avatarUrl', profile.avatar_url
  );
end;
$$;

create function public.social_get_snapshot(p_actor_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.social_assert_active_user(p_actor_user_id);
  return jsonb_build_object(
    'relationships', coalesce((
      select jsonb_agg(public.social_relationship_projection(r.id, p_actor_user_id) order by r.updated_at desc)
      from public.friend_relationships r
      where p_actor_user_id in (r.user_low_id, r.user_high_id)
    ), '[]'::jsonb),
    'blocks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'user', jsonb_build_object(
          'id', p.id,
          'username', p.username,
          'displayName', p.display_name,
          'avatarUrl', p.avatar_url
        ),
        'createdAt', b.created_at
      ) order by b.created_at desc)
      from public.user_blocks b
      join public.user_profiles p on p.id = b.blocked_user_id
      where b.blocker_id = p_actor_user_id
    ), '[]'::jsonb)
  );
end;
$$;

create function public.social_apply_friend_action(
  p_actor_user_id uuid,
  p_action public.social_friend_action,
  p_target_user_id uuid default null,
  p_relationship_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  relationship public.friend_relationships%rowtype;
  low_user_id uuid;
  high_user_id uuid;
begin
  perform public.social_assert_active_user(p_actor_user_id);

  if p_action in ('send_request', 'block', 'unblock') then
    if p_target_user_id is null or p_target_user_id = p_actor_user_id then
      raise exception 'social_self_action' using errcode = 'P0001';
    end if;
    if not exists (select 1 from public.user_profiles where id = p_target_user_id) then
      raise exception 'social_user_unavailable' using errcode = 'P0001';
    end if;
  else
    if p_relationship_id is null then
      raise exception 'social_relationship_not_found' using errcode = 'P0001';
    end if;
  end if;

  -- Serialize every pair-targeted mutation on the same two profile rows. This closes the race where
  -- a request could otherwise pass its block check while a concurrent block was being committed.
  if p_action in ('send_request', 'block', 'unblock') then
    perform 1
    from public.user_profiles
    where id in (p_actor_user_id, p_target_user_id)
    order by id
    for update;
  end if;

  if p_action = 'send_request' then
    perform public.social_assert_active_user(p_target_user_id);
    if exists (
      select 1 from public.user_blocks
      where (blocker_id = p_actor_user_id and blocked_user_id = p_target_user_id)
         or (blocker_id = p_target_user_id and blocked_user_id = p_actor_user_id)
    ) then
      raise exception 'social_interaction_blocked' using errcode = 'P0001';
    end if;

    low_user_id := least(p_actor_user_id, p_target_user_id);
    high_user_id := greatest(p_actor_user_id, p_target_user_id);
    insert into public.friend_relationships(user_low_id, user_high_id, requester_id)
    values (low_user_id, high_user_id, p_actor_user_id)
    on conflict (user_low_id, user_high_id) do nothing;

    select * into relationship from public.friend_relationships
    where user_low_id = low_user_id and user_high_id = high_user_id for update;
    if relationship.status = 'pending' and relationship.requester_id <> p_actor_user_id then
      update public.friend_relationships
      set status = 'accepted', accepted_at = now()
      where id = relationship.id returning * into relationship;
    end if;
    return public.social_relationship_projection(relationship.id, p_actor_user_id);
  end if;

  if p_action = 'block' then
    insert into public.user_blocks(blocker_id, blocked_user_id)
    values (p_actor_user_id, p_target_user_id)
    on conflict (blocker_id, blocked_user_id) do nothing;
    delete from public.friend_relationships
    where user_low_id = least(p_actor_user_id, p_target_user_id)
      and user_high_id = greatest(p_actor_user_id, p_target_user_id);
    return null;
  end if;

  if p_action = 'unblock' then
    delete from public.user_blocks
    where blocker_id = p_actor_user_id and blocked_user_id = p_target_user_id;
    return null;
  end if;

  select * into relationship from public.friend_relationships
  where id = p_relationship_id for update;
  if relationship.id is null or p_actor_user_id not in (relationship.user_low_id, relationship.user_high_id) then
    raise exception 'social_relationship_not_found' using errcode = 'P0001';
  end if;

  if p_action = 'accept_request' then
    if relationship.status = 'accepted' then
      return public.social_relationship_projection(relationship.id, p_actor_user_id);
    end if;
    if relationship.requester_id = p_actor_user_id then
      raise exception 'social_request_not_inbound' using errcode = 'P0001';
    end if;
    update public.friend_relationships set status = 'accepted', accepted_at = now()
    where id = relationship.id returning * into relationship;
    return public.social_relationship_projection(relationship.id, p_actor_user_id);
  end if;

  if p_action = 'decline_request' then
    if relationship.status <> 'pending' or relationship.requester_id = p_actor_user_id then
      raise exception 'social_request_not_inbound' using errcode = 'P0001';
    end if;
    delete from public.friend_relationships where id = relationship.id;
    return null;
  end if;

  if p_action = 'cancel_request' then
    if relationship.status <> 'pending' or relationship.requester_id <> p_actor_user_id then
      raise exception 'social_request_not_outbound' using errcode = 'P0001';
    end if;
    delete from public.friend_relationships where id = relationship.id;
    return null;
  end if;

  if p_action = 'remove_friend' then
    if relationship.status <> 'accepted' then
      raise exception 'social_relationship_not_accepted' using errcode = 'P0001';
    end if;
    delete from public.friend_relationships where id = relationship.id;
    return null;
  end if;

  raise exception 'social_action_unsupported' using errcode = 'P0001';
end;
$$;

comment on function public.social_apply_friend_action(uuid, public.social_friend_action, uuid, uuid) is
  'Atomic friendship/block state machine. Duplicate sends and accepts are idempotent; crossed requests become accepted; blocks delete the canonical relationship.';
comment on function public.social_find_user_by_username(uuid, text) is
  'Exact case-insensitive active-profile discovery with bidirectional block privacy and a minimal public projection.';
comment on function public.social_get_snapshot(uuid) is
  'Authoritative current-user friendship/request/block projection used to converge clients after command or reconnect.';

revoke all on function public.social_assert_active_user(uuid) from public, anon, authenticated;
revoke all on function public.social_relationship_projection(uuid, uuid) from public, anon, authenticated;
revoke all on function public.social_find_user_by_username(uuid, text) from public, anon, authenticated;
revoke all on function public.social_get_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.social_apply_friend_action(uuid, public.social_friend_action, uuid, uuid) from public, anon, authenticated;
grant execute on function public.social_find_user_by_username(uuid, text) to service_role;
grant execute on function public.social_get_snapshot(uuid) to service_role;
grant execute on function public.social_apply_friend_action(uuid, public.social_friend_action, uuid, uuid) to service_role;
