drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();
drop table if exists public.user_profiles cascade;
drop type if exists public.app_user_role cascade;
drop type if exists public.user_account_status cascade;

create type public.user_account_status as enum ('active', 'limited', 'disabled');
create type public.app_user_role as enum ('user', 'moderator', 'admin');

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
  email          text null,
  display_name   text not null,
  username       text null,
  avatar_url     text null,
  bio            text null,
  locale         text null,
  timezone       text null,
  website_url    text null,
  account_status public.user_account_status not null default 'active',
  app_role       public.app_user_role not null default 'user',
  banned_until   timestamp with time zone null,
  moderation_note text null,
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

create unique index user_profiles_email_unique_idx
  on public.user_profiles (lower(email))
  where email is not null;

create index user_profiles_account_status_idx
  on public.user_profiles (account_status);

create index user_profiles_app_role_idx
  on public.user_profiles (app_role);

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
    email,
    display_name,
    avatar_url,
    locale
  )
  values (
    new.id,
    nullif(lower(new.email), ''),
    generated_name,
    coalesce(nullif(metadata ->> 'avatar_url', ''), nullif(metadata ->> 'picture', '')),
    nullif(metadata ->> 'locale', '')
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        email = coalesce(public.user_profiles.email, excluded.email),
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

insert into public.user_profiles (id, email, display_name, avatar_url, locale, created_at, updated_at)
select
  u.id,
  nullif(lower(u.email), ''),
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

grant select, insert, update, delete on table public.user_profiles to service_role;
