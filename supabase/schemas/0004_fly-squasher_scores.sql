drop table if exists fly_squasher_scores;

CREATE TABLE fly_squasher_scores
(
  id      SERIAL PRIMARY KEY,
  score   INT  NOT NULL,
  level   INT  NOT NULL,
  user_id uuid not null,
  date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- add a foreign key constraint to the auth.users table
alter table fly_squasher_scores
  add constraint fly_squasher_scores_user_id_fkey foreign key (user_id) references auth.users (id);

drop policy if exists "Enable read access for all users" on fly_squasher_scores;
create policy "Enable read access for all users" on fly_squasher_scores for select using (true);

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON fly_squasher_scores;

CREATE POLICY "Enable write access for authenticated users"
  ON fly_squasher_scores
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id AND (select auth.role()) = 'user');

-- enable row level security
alter table fly_squasher_scores
  enable row level security;

create index fly_squasher_scores_user_id_idx
  on fly_squasher_scores (user_id);

-- create a view that joins the fly_squasher_scores table with the auth.users table to get the user's meta data (used full name)
-- and only returns the top 3 unique users' scores for each level (maximum score for each user)
drop view if exists fly_squasher_scores_with_user_meta;
CREATE VIEW fly_squasher_scores_with_user_meta
  with (security_invoker=on)
AS
WITH scores AS (SELECT fss.id,
                       fss.score,
                       fss.level,
                       fss.user_id,
                       fss.date,
                       pr.name,
                       ROW_NUMBER() OVER (PARTITION BY level ORDER BY score DESC) AS level_rn
                FROM (SELECT id,
                             score,
                             level,
                             user_id,
                             date,
                             DENSE_RANK() OVER (PARTITION BY level, user_id ORDER BY score DESC) AS rn
                      FROM fly_squasher_scores) fss
                       JOIN public.profiles pr ON fss.user_id = pr.id
                WHERE fss.rn = 1)
SELECT *
FROM scores
WHERE level_rn <= 3;

revoke all on table public.fly_squasher_scores from anon;
revoke all on table public.fly_squasher_scores from authenticated;
revoke all on table public.fly_squasher_scores_with_user_meta from anon;
revoke all on table public.fly_squasher_scores_with_user_meta from authenticated;
revoke all on sequence public.fly_squasher_scores_id_seq from anon;
revoke all on sequence public.fly_squasher_scores_id_seq from authenticated;

grant insert on table public.fly_squasher_scores to service_role;
grant select (id, score, level, user_id, date) on table public.fly_squasher_scores to service_role;
grant select on table public.fly_squasher_scores_with_user_meta to service_role;
grant usage, select on sequence public.fly_squasher_scores_id_seq to service_role;
