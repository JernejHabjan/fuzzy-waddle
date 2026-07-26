-- Campaign victory transaction workflow:
--
-- run(base profile revision) -> lock run + profile -> validate revision/integrity
--      -> write profile + claim ledger + mission progress -> mark run committed
--
-- The claim ledger is the idempotency boundary: retries return the committed result and
-- never apply a reward delta twice.

create type public.probable_waffle_campaign_difficulty as enum ('story', 'normal', 'hard');
create type public.probable_waffle_campaign_commit_status as enum ('pending', 'committed', 'rejected');

comment on type public.probable_waffle_campaign_difficulty is
  'Stable authored campaign difficulty selected for a run and used when resolving encounter tuning.';
comment on type public.probable_waffle_campaign_commit_status is
  'Lifecycle of the idempotent profile-and-reward transaction for a completed campaign run.';

alter table public.probable_waffle_game_saves
  add column campaign_loadout_ids text[] null,
  add column campaign_loadout_snapshot_hash text null;

comment on column public.probable_waffle_game_saves.campaign_loadout_ids is
  'Stable progression loadout IDs active when the campaign save was created.';
comment on column public.probable_waffle_game_saves.campaign_loadout_snapshot_hash is
  'Canonical hash of the resolved loadout, used to explain and detect profile/save drift.';

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

comment on table public.probable_waffle_campaign_profiles is
  'Versioned per-user campaign profile authority. The document is retained as one atomic domain snapshot while indexed columns serve fast UI queries.';
comment on column public.probable_waffle_campaign_profiles.user_id is 'Profile owner; deleting the authenticated user also removes campaign state.';
comment on column public.probable_waffle_campaign_profiles.schema_version is 'Profile-document schema version used by explicit migrations.';
comment on column public.probable_waffle_campaign_profiles.revision is 'Optimistic-concurrency revision incremented by a successful campaign reward commit.';
comment on column public.probable_waffle_campaign_profiles.profile_document is 'Canonical JSON profile consumed by the shared campaign-progression contract.';
comment on column public.probable_waffle_campaign_profiles.active_loadout_ids is 'Indexed copy of the profile active loadout for query and validation support.';
comment on column public.probable_waffle_campaign_profiles.seen_cinematic_ids is 'Indexed copy of cinematics already acknowledged by this profile.';
comment on column public.probable_waffle_campaign_profiles.created_at is 'Profile creation timestamp.';
comment on column public.probable_waffle_campaign_profiles.updated_at is 'Most recent successful profile synchronization timestamp.';

alter table public.probable_waffle_campaign_progress
  add column completion_count integer not null default 1 check (completion_count > 0),
  add column best_difficulty public.probable_waffle_campaign_difficulty not null default 'normal',
  add column best_duration_seconds integer null check (best_duration_seconds is null or best_duration_seconds >= 0),
  add column completed_objective_ids text[] not null default '{}';

comment on column public.probable_waffle_campaign_progress.completion_count is 'Number of recorded successful completions for this user and mission.';
comment on column public.probable_waffle_campaign_progress.best_difficulty is 'Highest or most demanding difficulty recorded by the campaign progression policy.';
comment on column public.probable_waffle_campaign_progress.best_duration_seconds is 'Shortest eligible completion duration when the mission reports one.';
comment on column public.probable_waffle_campaign_progress.completed_objective_ids is 'Stable IDs of objectives completed in the retained best/most recent campaign result.';

alter table public.probable_waffle_campaign_runs
  add column mission_revision integer not null default 1 check (mission_revision > 0),
  add column difficulty public.probable_waffle_campaign_difficulty not null default 'normal',
  add column base_profile_revision integer not null default 0 check (base_profile_revision >= 0),
  add column selected_loadout_ids text[] not null default '{}',
  add column loadout_snapshot_hash text not null default '',
  add column integrity jsonb not null default '{"eligibleForRewards":true,"invalidationReasons":[]}'::jsonb,
  add column commit_status public.probable_waffle_campaign_commit_status not null default 'pending',
  add column commit_result jsonb null;

comment on column public.probable_waffle_campaign_runs.mission_revision is 'Authored mission revision used to replay or migrate this run accurately.';
comment on column public.probable_waffle_campaign_runs.difficulty is 'Resolved campaign difficulty for this run.';
comment on column public.probable_waffle_campaign_runs.base_profile_revision is 'Profile revision locked when the run started for optimistic reward commits.';
comment on column public.probable_waffle_campaign_runs.selected_loadout_ids is 'Stable selected profile loadout IDs copied into the immutable run record.';
comment on column public.probable_waffle_campaign_runs.loadout_snapshot_hash is 'Canonical hash of the resolved starting loadout.';
comment on column public.probable_waffle_campaign_runs.integrity is 'Reward-eligibility state and reasons invalidated by developer tools or other non-eligible execution.';
comment on column public.probable_waffle_campaign_runs.commit_status is 'Current outcome of the atomic profile-and-reward commit.';
comment on column public.probable_waffle_campaign_runs.commit_result is 'Persisted idempotent result returned when a committed run is submitted again.';

create table public.probable_waffle_campaign_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_id text not null,
  run_id uuid not null references public.probable_waffle_campaign_runs(id) on delete cascade,
  mission_id public.probable_waffle_campaign_mission_id not null,
  committed_delta jsonb not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, claim_id)
);

comment on table public.probable_waffle_campaign_reward_claims is
  'Idempotency ledger preventing a reward claim from changing a profile more than once.';
comment on column public.probable_waffle_campaign_reward_claims.user_id is 'Owner of the committed reward claim.';
comment on column public.probable_waffle_campaign_reward_claims.claim_id is 'Stable reward claim key unique for this user.';
comment on column public.probable_waffle_campaign_reward_claims.run_id is 'Campaign run that earned the claim.';
comment on column public.probable_waffle_campaign_reward_claims.mission_id is 'Mission that supplied the committed reward.';
comment on column public.probable_waffle_campaign_reward_claims.committed_delta is 'Canonical profile delta applied for this idempotent reward claim.';
comment on column public.probable_waffle_campaign_reward_claims.claimed_at is 'Time at which the claim was atomically recorded.';

alter table public.probable_waffle_campaign_profiles enable row level security;
alter table public.probable_waffle_campaign_reward_claims enable row level security;
create policy "Service role owns campaign profiles" on public.probable_waffle_campaign_profiles for all to service_role using (true) with check (true);
create policy "Service role owns campaign reward claims" on public.probable_waffle_campaign_reward_claims for all to service_role using (true) with check (true);
comment on policy "Service role owns campaign profiles" on public.probable_waffle_campaign_profiles is
  'Campaign profiles are written only through trusted server flows so profile revision and reward-claim transactions remain atomic.';
comment on policy "Service role owns campaign reward claims" on public.probable_waffle_campaign_reward_claims is
  'The idempotency ledger is server-owned; clients cannot create or alter reward claims independently of a verified run.';
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
  'Atomically locks and validates the campaign run/profile revision, applies the canonical profile document, records idempotent reward claims, updates mission progress, and marks victory committed. A repeated call for an already committed run returns the stored result without applying a second delta.';

revoke all on function public.commit_probable_waffle_campaign_victory(uuid, uuid, public.probable_waffle_campaign_mission_id, integer, jsonb, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.commit_probable_waffle_campaign_victory(uuid, uuid, public.probable_waffle_campaign_mission_id, integer, jsonb, jsonb, jsonb, jsonb, jsonb) to service_role;
