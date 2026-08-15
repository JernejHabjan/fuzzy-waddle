-- Personal preferences sync after sign-in. Local storage remains an offline/anonymous fallback.
alter table public.user_profiles
  add column if not exists probable_waffle_preferences jsonb null;

comment on column public.user_profiles.probable_waffle_preferences is
  'Versioned personal Probable Waffle preferences. Match-authoritative rules are intentionally excluded.';
