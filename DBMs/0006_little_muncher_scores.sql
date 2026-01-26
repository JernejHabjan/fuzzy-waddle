-- Little Muncher High Scores Table
CREATE TABLE little_muncher_scores (
  id        SERIAL PRIMARY KEY,
  score     INT NOT NULL,
  hill      INT NOT NULL,  -- LittleMuncherHillEnum (1-7)
  user_id   uuid NOT NULL,
  date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_little_muncher_scores_user_id ON little_muncher_scores(user_id);
CREATE INDEX idx_little_muncher_scores_hill ON little_muncher_scores(hill);
CREATE INDEX idx_little_muncher_scores_score ON little_muncher_scores(score);

-- Row Level Security
ALTER TABLE little_muncher_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read scores
CREATE POLICY "Allow read access for all users"
  ON little_muncher_scores FOR SELECT USING (true);

-- Policy: Allow authenticated users to insert their own scores
CREATE POLICY "Allow insert for authenticated users"
  ON little_muncher_scores FOR INSERT TO authenticated WITH CHECK (true);

-- View: Top 3 unique users per hill (highest score per user)
DROP VIEW IF EXISTS little_muncher_scores_with_user_meta;
CREATE VIEW little_muncher_scores_with_user_meta AS
WITH ranked_scores AS (
  SELECT
    s.id,
    s.score,
    s.hill,
    s.user_id,
    s.date,
    p.name AS user_name,
    ROW_NUMBER() OVER (PARTITION BY s.hill, s.user_id ORDER BY s.score DESC) as user_rn
  FROM little_muncher_scores s
  JOIN profiles p ON s.user_id = p.id
),
unique_user_scores AS (
  SELECT * FROM ranked_scores WHERE user_rn = 1
),
hill_ranked AS (
  SELECT
    id,
    score,
    hill,
    user_id,
    user_name,
    date,
    ROW_NUMBER() OVER (PARTITION BY hill ORDER BY score DESC) as hill_rn
  FROM unique_user_scores
)
SELECT id, score, hill, user_id, user_name, date
FROM hill_ranked
WHERE hill_rn <= 3
ORDER BY hill, hill_rn;
