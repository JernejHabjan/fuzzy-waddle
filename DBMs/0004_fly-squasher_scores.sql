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
  add constraint test_user_id_fkey foreign key (user_id) references auth.users (id);

drop policy if exists "Enable read access for all users" on fly_squasher_scores;
create policy "Enable read access for all users" on fly_squasher_scores for select using (true);

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON fly_squasher_scores;

CREATE POLICY "Enable write access for authenticated users"
  ON fly_squasher_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.role() = 'user');

-- enable row level security
alter table fly_squasher_scores
  enable row level security;

-- Index for user_id, assisting in join operations
CREATE INDEX idx_fly_squasher_scores_userid ON fly_squasher_scores (user_id);

-- Index for level, assisting in partitioning data within ranking operations
CREATE INDEX idx_fly_squasher_scores_level ON fly_squasher_scores (level);

-- Index for score, assisting in ordering data within ranking operations
CREATE INDEX idx_fly_squasher_scores_score ON fly_squasher_scores (score);

-- create a view that joins the fly_squasher_scores table with the auth.users table to get the user's meta data (used full name)
-- and only returns the top 3 unique users' scores for each level (maximum score for each user)
CREATE OR REPLACE VIEW fly_squasher_scores_with_user_meta AS
WITH scores AS (SELECT fss.id,
                       fss.score,
                       fss.level,
                       fss.user_id,
                       fss.date,
                       au.raw_user_meta_data,
                       ROW_NUMBER() OVER (PARTITION BY level ORDER BY score DESC) AS level_rn
                FROM (SELECT id,
                             score,
                             level,
                             user_id,
                             date,
                             DENSE_RANK() OVER (PARTITION BY level, user_id ORDER BY score DESC) AS rn
                      FROM fly_squasher_scores) fss
                       JOIN auth.users au ON fss.user_id = au.id
                WHERE fss.rn = 1)
SELECT *
FROM scores
WHERE level_rn <= 3;
