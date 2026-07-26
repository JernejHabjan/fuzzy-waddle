-- Canonical schema mirror of the campaign profile/reward transaction. Keep these object
-- comments aligned with the migration because database introspection is documentation for
-- server maintenance and recovery work as well as DDL.

create type public.probable_waffle_campaign_difficulty as enum ('story', 'normal', 'hard');
create type public.probable_waffle_campaign_commit_status as enum ('pending', 'committed', 'rejected');

comment on type public.probable_waffle_campaign_difficulty is 'Stable campaign difficulty used by run resolution and encounter tuning.';
comment on type public.probable_waffle_campaign_commit_status is 'Lifecycle of an idempotent campaign profile and reward commit.';

create table public.probable_waffle_campaign_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version > 0),
  revision integer not null default 0 check (revision >= 0),
  profile_document jsonb not null,
  active_loadout_ids text[] not null default '{}',
  seen_cinematic_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.probable_waffle_campaign_profiles is 'Canonical versioned campaign profile per authenticated user.';
comment on column public.probable_waffle_campaign_profiles.user_id is 'Authenticated profile owner.';
comment on column public.probable_waffle_campaign_profiles.schema_version is 'Version of the canonical profile document.';
comment on column public.probable_waffle_campaign_profiles.revision is 'Optimistic-concurrency revision for profile updates.';
comment on column public.probable_waffle_campaign_profiles.profile_document is 'Canonical JSON campaign profile.';
comment on column public.probable_waffle_campaign_profiles.active_loadout_ids is 'Indexed selected progression loadout IDs.';
comment on column public.probable_waffle_campaign_profiles.seen_cinematic_ids is 'Indexed cinematics already seen by this profile.';
comment on column public.probable_waffle_campaign_profiles.created_at is 'Profile creation time.';
comment on column public.probable_waffle_campaign_profiles.updated_at is 'Most recent profile update time.';

alter table public.probable_waffle_campaign_progress
  add column completion_count integer not null default 1 check (completion_count > 0),
  add column best_difficulty public.probable_waffle_campaign_difficulty not null default 'normal',
  add column best_duration_seconds integer null check (best_duration_seconds is null or best_duration_seconds >= 0),
  add column completed_objective_ids text[] not null default '{}';

alter table public.probable_waffle_campaign_runs
  add column mission_revision integer not null default 1 check (mission_revision > 0),
  add column difficulty public.probable_waffle_campaign_difficulty not null default 'normal',
  add column base_profile_revision integer not null default 0 check (base_profile_revision >= 0),
  add column selected_loadout_ids text[] not null default '{}',
  add column loadout_snapshot_hash text not null default '',
  add column integrity jsonb not null default '{"eligibleForRewards":true,"invalidationReasons":[]}'::jsonb,
  add column commit_status public.probable_waffle_campaign_commit_status not null default 'pending',
  add column commit_result jsonb null;

create table public.probable_waffle_campaign_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id text not null,
  run_id uuid not null references public.probable_waffle_campaign_runs(id) on delete cascade,
  mission_id public.probable_waffle_campaign_mission_id not null,
  committed_delta jsonb not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, claim_id)
);

comment on table public.probable_waffle_campaign_reward_claims is 'Idempotency ledger for committed campaign rewards.';
comment on column public.probable_waffle_campaign_reward_claims.user_id is 'Reward-claim owner.';
comment on column public.probable_waffle_campaign_reward_claims.claim_id is 'Stable reward idempotency key.';
comment on column public.probable_waffle_campaign_reward_claims.run_id is 'Run that produced the reward.';
comment on column public.probable_waffle_campaign_reward_claims.mission_id is 'Mission that authored the reward.';
comment on column public.probable_waffle_campaign_reward_claims.committed_delta is 'Canonical profile delta applied by the claim.';
comment on column public.probable_waffle_campaign_reward_claims.claimed_at is 'Time the reward was committed.';

alter table public.probable_waffle_campaign_profiles enable row level security;
alter table public.probable_waffle_campaign_reward_claims enable row level security;
create policy "Service role owns campaign profiles" on public.probable_waffle_campaign_profiles for all to service_role using (true) with check (true);
create policy "Service role owns campaign reward claims" on public.probable_waffle_campaign_reward_claims for all to service_role using (true) with check (true);
grant select, insert, update, delete on public.probable_waffle_campaign_profiles to service_role;
grant select, insert, update, delete on public.probable_waffle_campaign_reward_claims to service_role;

create function public.commit_probable_waffle_campaign_victory(
  p_user_id uuid,
  p_run_id uuid,
  p_mission_id public.probable_waffle_campaign_mission_id,
  p_base_profile_revision integer,
  p_profile_document jsonb,
  p_reward_claims jsonb,
  p_progress_metadata jsonb,
  p_result_metadata jsonb,
  p_commit_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_revision integer;
  current_run public.probable_waffle_campaign_runs%rowtype;
  claim jsonb;
begin
  select *
    into current_run
    from public.probable_waffle_campaign_runs
    where id = p_run_id and user_id = p_user_id
    for update;

  if current_run.id is null or current_run.mission_id <> p_mission_id then
    raise exception 'campaign run was not found';
  end if;
  if current_run.commit_status = 'committed' then
    return current_run.commit_result;
  end if;

  select revision
    into current_revision
    from public.probable_waffle_campaign_profiles
    where user_id = p_user_id
    for update;

  if current_revision is null or current_revision <> p_base_profile_revision then
    raise exception 'campaign profile revision conflict' using errcode = '40001';
  end if;
  if (p_profile_document #>> '{progression,revision}')::integer <> p_base_profile_revision + 1 then
    raise exception 'campaign profile revision increment is invalid';
  end if;

  update public.probable_waffle_campaign_profiles
    set schema_version = (p_profile_document ->> 'schemaVersion')::integer,
        revision = (p_profile_document #>> '{progression,revision}')::integer,
        profile_document = p_profile_document,
        active_loadout_ids = coalesce(array(select jsonb_array_elements_text(p_profile_document -> 'activeLoadoutIds')), '{}'),
        seen_cinematic_ids = coalesce(array(select jsonb_array_elements_text(p_profile_document -> 'seenCinematicIds')), '{}'),
        updated_at = now()
    where user_id = p_user_id;

  for claim in select value from jsonb_array_elements(coalesce(p_reward_claims, '[]'::jsonb))
  loop
    insert into public.probable_waffle_campaign_reward_claims (
      user_id, claim_id, run_id, mission_id, committed_delta
    ) values (
      p_user_id,
      claim ->> 'claimId',
      p_run_id,
      p_mission_id,
      coalesce(claim -> 'committedDelta', '{}'::jsonb)
    ) on conflict (user_id, claim_id) do nothing;
  end loop;

  insert into public.probable_waffle_campaign_progress (
    user_id,
    mission_id,
    completed_at,
    result_metadata,
    completion_count,
    best_difficulty,
    best_duration_seconds,
    completed_objective_ids
  ) values (
    p_user_id,
    p_mission_id,
    (p_progress_metadata ->> 'firstCompletedAt')::timestamptz,
    p_progress_metadata,
    (p_progress_metadata ->> 'completionCount')::integer,
    (p_progress_metadata ->> 'bestDifficulty')::public.probable_waffle_campaign_difficulty,
    nullif(p_progress_metadata ->> 'bestDurationSeconds', '')::integer,
    coalesce(array(select jsonb_array_elements_text(p_progress_metadata -> 'completedObjectiveIds')), '{}')
  )
  on conflict (user_id, mission_id) do update
    set completed_at = excluded.completed_at,
        result_metadata = excluded.result_metadata,
        completion_count = excluded.completion_count,
        best_difficulty = excluded.best_difficulty,
        best_duration_seconds = excluded.best_duration_seconds,
        completed_objective_ids = excluded.completed_objective_ids;

  update public.probable_waffle_campaign_runs
    set outcome = 'victory',
        completed_at = now(),
        result_metadata = p_result_metadata,
        integrity = coalesce(p_result_metadata -> 'integrity', integrity),
        commit_status = 'committed',
        commit_result = p_commit_result
    where id = p_run_id and user_id = p_user_id;

  return p_commit_result;
end;
$$;

comment on function public.commit_probable_waffle_campaign_victory(uuid, uuid, public.probable_waffle_campaign_mission_id, integer, jsonb, jsonb, jsonb, jsonb, jsonb) is
  'Atomic victory transaction that validates revision, records reward claims, updates profile and mission progress, and returns an idempotent result.';

revoke all on function public.commit_probable_waffle_campaign_victory(uuid, uuid, public.probable_waffle_campaign_mission_id, integer, jsonb, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.commit_probable_waffle_campaign_victory(uuid, uuid, public.probable_waffle_campaign_mission_id, integer, jsonb, jsonb, jsonb, jsonb, jsonb) to service_role;
