drop table if exists probable_waffle_achievements;

CREATE TABLE probable_waffle_achievements
(
  id             SERIAL PRIMARY KEY,
  achievement_id VARCHAR(50) NOT NULL,
  user_id        uuid NOT NULL,
  unlocked_date  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata       JSONB -- Optional metadata about the achievement (e.g., progress data)
);

-- Add a foreign key constraint to the auth.users table
ALTER TABLE probable_waffle_achievements
  ADD CONSTRAINT probable_waffle_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id);

-- Create a unique constraint to prevent duplicate achievements for a user
ALTER TABLE probable_waffle_achievements
  ADD CONSTRAINT probable_waffle_achievements_user_achievement_unique UNIQUE (user_id, achievement_id);

-- Row-level security policies
DROP POLICY IF EXISTS "Enable read access for own achievements" ON probable_waffle_achievements;
CREATE POLICY "Enable read access for all achievements"
  ON probable_waffle_achievements
  FOR SELECT
  USING (true); -- Allow anyone to read any achievement

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON probable_waffle_achievements;
CREATE POLICY "Enable insert access for own achievements"
  ON probable_waffle_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id); -- Only require user_id match, not specific role

-- Enable row level security
ALTER TABLE probable_waffle_achievements
  ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient querying
CREATE INDEX idx_probable_waffle_achievements_userid ON probable_waffle_achievements (user_id);
CREATE INDEX idx_probable_waffle_achievements_id ON probable_waffle_achievements (achievement_id);
