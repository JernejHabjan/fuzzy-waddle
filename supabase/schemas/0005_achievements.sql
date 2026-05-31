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

grant select, insert, update, delete on table public.achievement_definitions to service_role;
grant select, insert, update, delete on table public.user_achievement_unlocks to service_role;
grant usage, select on sequence public.user_achievement_unlocks_id_seq to service_role;
