-- Explicit Data API grants for projects where automatic exposure of new public tables is disabled.
-- See: https://github.com/orgs/supabase/discussions/45329

-- Service role access used by backend API.
grant insert on table public.fly_squasher_scores to service_role;
grant select on table public.fly_squasher_scores_with_user_meta to service_role;

grant insert, select on table public.messages to service_role;

grant insert on table public.little_muncher_scores to service_role;
grant select on table public.little_muncher_scores_with_user_meta to service_role;

grant select, insert, update on table public.probable_waffle_game_sessions to service_role;
grant select, insert on table public.probable_waffle_player_scores to service_role;
grant select on table public.probable_waffle_score_metric_types to service_role;
grant select, insert on table public.probable_waffle_player_score_metrics to service_role;
grant select, insert on table public.probable_waffle_score_snapshots to service_role;

grant execute on function public.refresh_probable_waffle_player_scores_full() to service_role;

-- Authenticated client access currently used directly from the browser.
grant select, insert on table public.probable_waffle_achievements to authenticated;

-- Sequence access required for INSERT defaults.
grant usage, select on sequence public.fly_squasher_scores_id_seq to service_role;
grant usage, select on sequence public.messages_id_seq to service_role;
grant usage, select on sequence public.little_muncher_scores_id_seq to service_role;
grant usage, select on sequence public.probable_waffle_player_scores_id_seq to service_role;
grant usage, select on sequence public.probable_waffle_player_score_metrics_id_seq to service_role;
grant usage, select on sequence public.probable_waffle_score_snapshots_id_seq to service_role;
grant usage, select on sequence public.probable_waffle_achievements_id_seq to authenticated;
