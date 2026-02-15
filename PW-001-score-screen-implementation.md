# PW-001: Score Screen Data Collection System

## Quick Start

**Goal**: Implement a comprehensive score tracking system for Probable Waffle RTS that collects player statistics throughout the game and persists them to a database for analysis.

**Key Changes**:
- ✅ Database migrations created/updated (2 new + 1 updated in `DBMs/` folder)
- 🔄 Score tracking system (similar to `GameModeConditionChecker`)
- 🔄 API endpoints for session and score persistence
- 🔄 UI updates to display comprehensive player statistics
- 🔄 Offline mode support (no persistence when server unavailable)

---

## Overview
Implement a data collection system for the score screen that tracks player statistics throughout the game (single-player and multiplayer). Similar to `GameModeConditionChecker`, this system will continuously monitor and record player performance metrics.

### Database Design Choice
**Hybrid Normalized Design (EAV + Core Fields)**

Instead of a wide table with ~30 columns, we use a **3-table structure**:
1. **Core table**: Player info and game result (always present)
2. **Metric types table**: Catalog of available metrics (metadata)
3. **Metric values table**: Actual metric data (EAV pattern)

**Why?**
- ✅ Add new metrics without schema changes (just INSERT into types table)
- ✅ Only store non-zero metrics (saves space, no sparse columns)
- ✅ Rich metadata for each metric (name, description, category, display order)
- ✅ Excellent query performance (materialized view pivots data into columns)
- ✅ Easy to extend for new game modes or features

**See detailed sections below for complete design documentation.**

---

## Database Design: Detailed Architecture

### Why Hybrid Normalized Design?

**Problem with Wide Table Approach:**
- ❌ Need ALTER TABLE to add new metrics (downtime)
- ❌ Sparse data if metrics don't apply to all game modes
- ❌ No metadata about what each metric means
- ❌ Hard to make metrics configurable
- ❌ Every player record has ALL columns even if unused

**Solution: 3-Table Hybrid Design**

```
probable_waffle_player_scores (Core - 13 columns)
├── id, game_session_id, user_id, player_number
├── player_name, player_type, team_number, faction_type
├── game_result, eliminated, eliminated_at
└── final_score, created_at

probable_waffle_score_metric_types (Catalog)
├── id, metric_key, metric_name, metric_category
├── description, display_order, is_active
└── 20 pre-populated metrics

probable_waffle_player_score_metrics (EAV Values)
├── id, player_score_id (FK), metric_type_id (FK)
└── metric_value, created_at

PLUS: Materialized View (Performance)
└── probable_waffle_player_scores_full
    └── Pivots EAV data into columns for fast queries
```

### Benefits of This Design

✅ **Add New Metrics Without Schema Changes**
```sql
-- No ALTER TABLE needed!
INSERT INTO probable_waffle_score_metric_types 
VALUES ('workers_trained', 'Workers Trained', 'economy', ...);
-- Immediately usable
```

✅ **Only Store Non-Zero Metrics** - Saves space, no sparse data

✅ **Rich Metadata** - Each metric has name, category, description, display order

✅ **Performance** - Materialized view provides columnar access like wide table

✅ **Self-Documenting** - Query metric catalog to see what's tracked

### Schema Details

**Table 1: probable_waffle_player_scores (Core)**
```sql
- id BIGSERIAL PRIMARY KEY
- game_session_id UUID FK to sessions
- user_id UUID FK to profiles (NULL for AI)
- player_number INT
- player_name TEXT
- player_type TEXT (Human/AI)
- team_number INT
- faction_type TEXT
- game_result TEXT (win/loss/tie/quit)
- eliminated BOOLEAN
- eliminated_at TIMESTAMP
- final_score INT
- created_at TIMESTAMP
```

**Table 2: probable_waffle_score_metric_types (Catalog)**
```sql
- id SERIAL PRIMARY KEY
- metric_key TEXT UNIQUE (e.g., 'units_produced')
- metric_name TEXT (e.g., 'Units Produced')
- metric_category TEXT (units/buildings/resources/combat/economy)
- description TEXT
- display_order INT
- is_active BOOLEAN
- created_at TIMESTAMP
```

**Pre-populated with 20 Metrics:**
- Units: produced, killed, lost
- Buildings: constructed, destroyed, lost
- Resources: collected/spent/final (minerals, stone, wood)
- Combat: damage_dealt, damage_received, healing_done
- Economy: max_army_size, max_building_count

**Table 3: probable_waffle_player_score_metrics (Values)**
```sql
- id BIGSERIAL PRIMARY KEY
- player_score_id BIGINT FK to player_scores
- metric_type_id INT FK to metric_types
- metric_value BIGINT
- created_at TIMESTAMP
- UNIQUE (player_score_id, metric_type_id)
```

**Materialized View: probable_waffle_player_scores_full**
```sql
-- Pivots EAV data into columns
SELECT ps.*, 
  MAX(CASE WHEN mt.metric_key = 'units_produced' THEN m.metric_value END) as units_produced,
  MAX(CASE WHEN mt.metric_key = 'units_killed' THEN m.metric_value END) as units_killed,
  -- ... all 20 metrics as columns
FROM probable_waffle_player_scores ps
LEFT JOIN probable_waffle_player_score_metrics m ON ps.id = m.player_score_id
LEFT JOIN probable_waffle_score_metric_types mt ON m.metric_type_id = mt.id
GROUP BY ps.id;
```

**Helper Functions:**
```sql
-- Get metrics as JSON
CREATE FUNCTION get_player_score_metrics(player_score_id BIGINT)
RETURNS JSONB;

-- Upsert single metric
CREATE FUNCTION upsert_player_score_metric(
  player_score_id BIGINT, 
  metric_key TEXT, 
  metric_value BIGINT
) RETURNS VOID;

-- Refresh materialized view
CREATE FUNCTION refresh_probable_waffle_player_scores_full()
RETURNS VOID;
```

### Usage Examples

**Insert Player Score:**
```sql
-- 1. Insert core data
INSERT INTO probable_waffle_player_scores 
  (game_session_id, user_id, player_number, player_name, ...)
VALUES ('uuid', 'user-uuid', 1, 'Player1', ...)
RETURNING id; -- Returns: 123

-- 2. Batch insert metrics
INSERT INTO probable_waffle_player_score_metrics 
  (player_score_id, metric_type_id, metric_value)
SELECT 123, mt.id, v.value
FROM (VALUES 
  ('units_produced', 50),
  ('units_killed', 30),
  ('damage_dealt', 5000)
) AS v(metric_key, value)
JOIN probable_waffle_score_metric_types mt ON mt.metric_key = v.metric_key;

-- 3. Refresh materialized view
SELECT refresh_probable_waffle_player_scores_full();
```

**Query All Metrics:**
```sql
-- Use materialized view (fast)
SELECT * FROM probable_waffle_player_scores_full
WHERE game_session_id = 'uuid'
ORDER BY final_score DESC;
```

**Query By Category:**
```sql
-- Get all combat metrics
SELECT mt.metric_name, m.metric_value
FROM probable_waffle_player_score_metrics m
JOIN probable_waffle_score_metric_types mt ON m.metric_type_id = mt.id
WHERE m.player_score_id = 123
  AND mt.metric_category = 'combat'
ORDER BY mt.display_order;
```

---

## Multiplayer Score Submission: Last Human Player Strategy

### Problem
In multiplayer games, multiple human players see the score screen when they exit. We need **exactly one submission** to avoid duplicates.

### Solution: Last Human Player Submits

**Strategy:**
1. Track `human_player_count` when game session created
2. Each client checks if all other humans have `leftOrKilled = true`
3. Only the last human player submits scores to API
4. API is idempotent (safe for race conditions)

### Implementation Flow

**1. Game Session Creation**
```typescript
// API: When matchmaking/lobby creates game
const humanPlayers = gameInstance.players.filter(
  p => p.playerType === ProbableWafflePlayerType.Human
);

await gameSessionService.createSession({
  gameInstanceId: uuid,
  gameType: 'Matchmaking',
  mapId: 'map_1',
  createdByUserId: hostUserId,
  humanPlayerCount: humanPlayers.length  // Track total humans
});
```

**Database stores:**
```sql
- human_player_count = 3 (for example)
- scores_submitted = false
- scores_submitted_by = null
```

**2. Players Exit Game**
```typescript
// Each player's client tracks:
player.playerController.data.leftOrKilled = true;
```

**3. Score Screen Detection**
```typescript
// Client: score-submission.service.ts
isLastHumanPlayer(gameInstance, currentUserId): boolean {
  const humanPlayers = gameInstance.players.filter(
    p => p.playerType === ProbableWafflePlayerType.Human
  );
  
  const otherHumans = humanPlayers.filter(
    p => p.userId !== currentUserId
  );
  
  // Check if all others have left/been eliminated
  return otherHumans.every(p => p.leftOrKilled === true);
}
```

**4. Conditional Submission**
```typescript
// Client: score-screen.component.ts
async ngOnInit() {
  const gameInstance = this.gameInstanceClientService.gameInstance;
  const currentUserId = this.authService.getCurrentUserId();
  
  // Only submit if:
  // 1. Game is online (has gameInstanceId)
  // 2. Current user is the last human player
  if (gameInstance.gameInstanceMetadata.data.gameInstanceId) {
    const isLast = this.scoreSubmissionService.isLastHumanPlayer(
      gameInstance, 
      currentUserId
    );
    
    if (isLast) {
      console.log('Last human player - submitting scores');
      await this.scoreSubmissionService.submitScores(
        gameInstance.gameInstanceMetadata.data.gameInstanceId,
        this.getAllPlayerScores(),
        currentUserId
      );
    } else {
      console.log('Not last player - skipping submission');
    }
  }
}
```

**5. API Idempotency**
```typescript
// API: game-session.controller.ts
async submitScores(dto: SubmitScoresDto) {
  const session = await this.gameSessionService.getSession(dto.gameInstanceId);
  
  // Already submitted? Return success without error
  if (session.scores_submitted) {
    console.log('Scores already submitted - idempotent return');
    return { success: true, message: 'Scores already recorded' };
  }
  
  // First submission - process it
  await this.db.transaction(async (trx) => {
    // Insert all player scores + metrics
    for (const playerScore of dto.playerScores) {
      const scoreId = await insertPlayerScore(playerScore);
      await insertPlayerMetrics(scoreId, playerScore.metrics);
    }
    
    // Mark as submitted
    await trx('probable_waffle_game_sessions')
      .where({ game_instance_id: dto.gameInstanceId })
      .update({
        scores_submitted: true,
        scores_submitted_by: dto.submittedByUserId,
        scores_submitted_at: new Date(),
        session_state: 'Completed',
        ended_at: new Date()
      });
  });
  
  return { success: true };
}
```

### Edge Cases Handled

**Simultaneous Exit:** Both players think they're "last"
- Both submit to API
- First succeeds, second returns success (idempotent)
- No duplicate data ✅

**Last Player Crashes:** Scores not submitted
- Game doesn't appear in match history (graceful degradation)
- OR: Backend cron job detects abandoned games

**Offline Game:** No server connection
- No `gameInstanceId` exists
- Client skips submission entirely
- Score screen works locally ✅

**Single Player vs AI:** Always submits
- `human_player_count` = 1
- Player is always "last"
- Submits normally with AI scores included ✅

### Multiplayer Flow Example (4 Players)

```
1. Game Starts → human_player_count = 4

2. Player A exits → checks, not last, skips submission
3. Player B exits → checks, not last, skips submission
4. Player C exits → checks, not last, skips submission
5. Player D exits → checks, IS LAST, SUBMITS all 4 players' scores ✅

6. Database updated → scores_submitted = true
7. All 4 players → can view match in history
```

---

## Match History Feature

### Database View
```sql
CREATE VIEW probable_waffle_match_history AS
SELECT 
  gs.*,
  -- Aggregate all players into JSON
  (SELECT json_agg(
    json_build_object(
      'player_number', ps.player_number,
      'player_name', ps.player_name,
      'game_result', ps.game_result,
      'final_score', ps.final_score,
      'is_current_user', ps.user_id = auth.uid()
    )
  ) FROM probable_waffle_player_scores ps
   WHERE ps.game_session_id = gs.id) as players,
  -- Current user's result
  (SELECT game_result FROM probable_waffle_player_scores 
   WHERE game_session_id = gs.id AND user_id = auth.uid()) as user_result
FROM probable_waffle_game_sessions gs
WHERE 
  scores_submitted = true  -- Only completed games
  AND EXISTS(  -- Only games user participated in
    SELECT 1 FROM probable_waffle_player_scores 
    WHERE game_session_id = gs.id AND user_id = auth.uid()
  )
ORDER BY ended_at DESC;
```

### API Endpoints

**1. Get Match History (Paginated)**
```
GET /api/probable-waffle/game-session/match-history?limit=20&offset=0
```

**Response:**
```json
{
  "matches": [
    {
      "id": "uuid-1",
      "game_type": "Matchmaking",
      "map_id": "map_1",
      "started_at": "2026-02-15T10:00:00Z",
      "ended_at": "2026-02-15T10:35:00Z",
      "total_duration_seconds": 2100,
      "human_player_count": 4,
      "user_result": "win",
      "players": [...]
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

**2. Get Match Details**
```
GET /api/probable-waffle/game-session/:gameInstanceId/details
```

**Response:**
```json
{
  "gameSession": {...},
  "playerScores": [
    {
      "playerNumber": 1,
      "playerName": "Player1",
      "gameResult": "win",
      "finalScore": 1500,
      "metrics": {
        "units_produced": 50,
        "damage_dealt": 5000,
        ...
      }
    }
  ]
}
```

### UI Flow

1. **User Opens Match History Page**
   - GET /match-history
   - Display table: Date, Map, Duration, Result, Players

2. **User Clicks Match**
   - Navigate to `/match-details/:gameInstanceId`
   - GET /details
   - Display using existing ScoreScreenComponent

3. **Features:**
   - List all past games (paginated)
   - Sort by date (newest first)
   - Filter by result (Win/Loss/Tie)
   - Click to see detailed breakdown
   - "Back to Match History" button

---

## Backend / API Interfaces

### 1. Score Data Structures ✅ COMPLETE
- [x] Create `PlayerScoreData` interface in `libs/api-interfaces/src/lib/game-instance/probable-waffle/score-data.ts`
  - [ ] `playerNumber: PlayerNumber`
  - [ ] `playerName: string`
  - [ ] `playerType: string` (Human/AI)
  - [ ] `teamNumber?: number`
  - [ ] `factionType: string`
  - [ ] `gameResult: 'win' | 'loss' | 'tie' | 'quit'`
  - [ ] `eliminated: boolean`
  - [ ] `eliminatedAt?: number`
  - [ ] `finalScore: number`
  - [ ] `metrics: Record<string, number>` // Dynamic metrics as key-value pairs
  - [ ] `userId?: string` // For linking to user profiles

- [ ] Create `ScoreMetricType` interface
  - [ ] `metricKey: string` (e.g., 'units_produced')
  - [ ] `metricName: string` (e.g., 'Units Produced')
  - [ ] `metricCategory: string` (units/buildings/resources/combat/economy)
  - [ ] `description?: string`
  - [ ] `displayOrder: number`

- [ ] Create helper type for standard metrics:
  ```typescript
  export const STANDARD_METRICS = {
    // Units
    UNITS_PRODUCED: 'units_produced',
    UNITS_KILLED: 'units_killed',
    UNITS_LOST: 'units_lost',
    // Buildings
    BUILDINGS_CONSTRUCTED: 'buildings_constructed',
    BUILDINGS_DESTROYED: 'buildings_destroyed',
    BUILDINGS_LOST: 'buildings_lost',
    // Resources
    RESOURCES_COLLECTED_MINERALS: 'resources_collected_minerals',
    RESOURCES_COLLECTED_STONE: 'resources_collected_stone',
    RESOURCES_COLLECTED_WOOD: 'resources_collected_wood',
    RESOURCES_SPENT_MINERALS: 'resources_spent_minerals',
    RESOURCES_SPENT_STONE: 'resources_spent_stone',
    RESOURCES_SPENT_WOOD: 'resources_spent_wood',
    FINAL_RESOURCES_MINERALS: 'final_resources_minerals',
    FINAL_RESOURCES_STONE: 'final_resources_stone',
    FINAL_RESOURCES_WOOD: 'final_resources_wood',
    // Combat
    DAMAGE_DEALT: 'damage_dealt',
    DAMAGE_RECEIVED: 'damage_received',
    HEALING_DONE: 'healing_done',
    // Economy
    MAX_ARMY_SIZE: 'max_army_size',
    MAX_BUILDING_COUNT: 'max_building_count'
  } as const;
  ```

- [ ] Create `GameScoreSnapshot` interface
  - [ ] `timestamp: number`
  - [ ] `playerScores: Map<PlayerNumber, PlayerScoreSnapshot>`

- [ ] Create `PlayerScoreSnapshot` interface
  - [ ] `unitsCount: number`
  - [ ] `buildingsCount: number`
  - [ ] `totalResources: number`
  - [ ] `armyValue: number`

- [ ] Add `scoreData: Map<PlayerNumber, PlayerScoreData>` to `ProbableWaffleGameStateData`

- [ ] Export new types from `libs/api-interfaces/src/index.ts`

---

## Client / Game Logic

### 2. Score Tracker Service
- [ ] Create `apps/client/src/app/probable-waffle/game/world/state/ScoreTracker.ts`
  - [ ] Inject `ProbableWaffleScene` in constructor
  - [ ] Initialize score data for all players
  - [ ] Set up lifecycle hooks (create, update, shutdown)

### 3. Data Collection Methods
- [ ] Implement `initializePlayerScores()`
  - [ ] Iterate all players from scene
  - [ ] Create initial `PlayerScoreData` for each player with empty metrics object
  - [ ] Store in scene's game state

- [ ] Implement `updateScores()` (throttled to 1000ms)
  - [ ] Get current player count from `ScenePlayerHelpers.getActorsByPlayer()`
  - [ ] Update live counts (units, buildings)
  - [ ] Track max values using `setMetric()` helper
  - [ ] Calculate army value

- [ ] Implement `setMetric(playerNumber, metricKey, value)` helper
  - [ ] Updates or sets metric value in player's metrics object
  - [ ] Example: `setMetric(1, 'units_produced', 50)`

- [ ] Implement `incrementMetric(playerNumber, metricKey, amount)` helper
  - [ ] Increments existing metric value
  - [ ] Example: `incrementMetric(1, 'damage_dealt', 100)`

- [ ] Implement `recordEvent()` method
  - [ ] Listen to player state summary changes
  - [ ] Process `unit_produced` events → increment 'units_produced'
  - [ ] Process `unit_killed` events → increment 'units_killed'
  - [ ] Process `building_constructed` events → increment 'buildings_constructed'
  - [ ] Process `building_destroyed` events → increment 'buildings_destroyed'
  - [ ] Process `resource_collected` events → increment resource metrics
  - [ ] Process `resource_spent` events → increment spend metrics

- [ ] Implement `trackDamage()` method
  - [ ] Subscribe to damage events from actors
  - [ ] Increment 'damage_dealt' for attacker
  - [ ] Increment 'damage_received' for victim

- [ ] Implement `trackHealing()` method
  - [ ] Subscribe to healing events from actors
  - [ ] Increment 'healing_done' for healer

- [ ] Implement `createSnapshot()` method
  - [ ] Called every 5 seconds
  - [ ] Record current state for timeline charts
  - [ ] Store in time-series array

### 4. Game Result Tracking
- [ ] Modify `GameModeConditionChecker.winGame()`
  - [ ] Call `ScoreTracker.setPlayerResult(currentPlayer, 'win')`
  - [ ] Call `ScoreTracker.setEnemyResults('loss')`

- [ ] Modify `GameModeConditionChecker.loseGame()`
  - [ ] Call `ScoreTracker.setPlayerResult(currentPlayer, 'loss')`
  - [ ] Call `ScoreTracker.setEnemyResults('win')`

- [ ] Modify `GameModeConditionChecker.tieGame()`
  - [ ] Call `ScoreTracker.setAllPlayerResults('tie')`

- [ ] Modify `GameModeConditionChecker.selfQuit()`
  - [ ] Call `ScoreTracker.setPlayerResult(currentPlayer, 'quit')`

- [ ] Implement `ScoreTracker.setPlayerResult(player, result)`
  - [ ] Update player's `gameResult` field
  - [ ] Record `eliminatedAt` timestamp if applicable

- [ ] Implement player elimination tracking
  - [ ] Listen to `leftOrKilled` flag changes
  - [ ] Mark player as `eliminated = true`
  - [ ] Record elimination timestamp

### 5. Integration with Game Scene
- [ ] Add `ScoreTracker` instantiation to `ProbableWaffleScene.create()`
  - [ ] Initialize after `GameModeConditionChecker`
  - [ ] Store reference in scene

- [ ] Add cleanup to scene shutdown
  - [ ] Unsubscribe from all events
  - [ ] Finalize score data

---

## Frontend / Score Screen UI

### 6. Score Data Service
- [ ] Create `apps/client/src/app/probable-waffle/services/score-data.service.ts`
  - [ ] Inject `GameInstanceClientService`
  - [ ] Provide methods to access score data
  - [ ] `getPlayerScore(playerNumber: PlayerNumber): PlayerScoreData`
  - [ ] `getAllPlayerScores(): PlayerScoreData[]`
  - [ ] `getSortedPlayersByScore(): PlayerScoreData[]`
  - [ ] `getScoreSnapshots(): GameScoreSnapshot[]`

### 7. Update Score Screen Component
- [ ] Modify `score-screen.component.ts`
  - [ ] Inject `ScoreDataService`
  - [ ] Pass score data to child components
  - [ ] Add loading state

- [ ] Modify `score-screen.component.html`
  - [ ] Pass `playerScores` to `ScoreTableComponent`
  - [ ] Pass `scoreSnapshots` to `ScoreThroughTimeComponent`

### 8. Update Score Table Component
- [ ] Modify `score-table.component.ts`
  - [ ] Accept `playerScores` input
  - [ ] Remove hardcoded mock data
  - [ ] Display all tracked metrics
  - [ ] Sort by final score
  - [ ] Highlight winner/loser/tie

- [ ] Add columns:
  - [ ] Player name
  - [ ] Result (Win/Loss/Tie/Quit)
  - [ ] Final Score
  - [ ] Units (Produced/Killed/Lost)
  - [ ] Buildings (Constructed/Destroyed/Lost)
  - [ ] Resources (Collected/Spent/Final)
  - [ ] Max Army Size
  - [ ] Damage Dealt/Received
  - [ ] Healing Done

### 9. Update Chart Component
- [ ] Modify `score-through-time.component.ts`
  - [ ] Accept `scoreSnapshots` input
  - [ ] Use snapshot data instead of player state summary
  - [ ] Support new chart types:
    - [ ] Army size over time
    - [ ] Building count over time
    - [ ] Total resources over time
    - [ ] Army value over time

- [ ] Add chart selector
  - [ ] Dropdown to switch between metric types

---

## Data Persistence

### 10. Database Schema - Game Sessions Table
- [ ] Create `DBMs/0007_probable_waffle_game_sessions.sql`
  - [ ] Table: `probable_waffle_game_sessions`
    - [ ] `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
    - [ ] `game_instance_id` UUID NOT NULL UNIQUE
    - [ ] `game_type` TEXT NOT NULL (InstantGame, Skirmish, Matchmaking, etc.)
    - [ ] `map_id` TEXT NOT NULL
    - [ ] `session_state` TEXT NOT NULL (initial: InProgress, final: Completed/Abandoned)
    - [ ] `started_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    - [ ] `ended_at` TIMESTAMP WITH TIME ZONE NULL
    - [ ] `total_duration_seconds` INT NULL
    - [ ] `created_by_user_id` UUID NOT NULL REFERENCES profiles(id)
    - [ ] `scores_submitted` BOOLEAN NOT NULL DEFAULT FALSE
    - [ ] `scores_submitted_by` UUID NULL REFERENCES profiles(id) - tracks who submitted scores
    - [ ] `scores_submitted_at` TIMESTAMP WITH TIME ZONE NULL
    - [ ] `human_player_count` INT NOT NULL DEFAULT 1 - number of human players in game
    - [ ] Foreign keys to profiles table
    - [ ] Indexes on game_instance_id, started_at, created_by_user_id
    - [ ] RLS policies (service_role for insert, authenticated users can read own sessions)
  
  - [ ] View: `probable_waffle_match_history`
    - [ ] Shows only completed games (scores_submitted = true)
    - [ ] Filters to only games where current user participated
    - [ ] Aggregates all player info as JSON
    - [ ] Includes user's result (win/loss/tie)
    - [ ] Ordered by ended_at DESC

- [x] Update `DBMs/0003_messages.sql` ✓ COMPLETED
  - [x] Change `game_instance_id` from TEXT to UUID
  - [x] Add foreign key constraint to `probable_waffle_game_sessions(game_instance_id)`
  - [x] Add comment explaining the relationship
  - [x] Keep existing indexes

### 11. Database Schema - Player Scores Tables (Normalized EAV Design)
- [ ] Create `DBMs/0008_probable_waffle_player_scores.sql` ✓ IMPROVED DESIGN
  
  **Table 1: `probable_waffle_player_scores` (Core fields only)**
    - [ ] `id` BIGSERIAL PRIMARY KEY
    - [ ] `game_session_id` UUID NOT NULL FK to sessions
    - [ ] `user_id` UUID NULL FK to profiles (NULL for AI)
    - [ ] `player_number` INT NOT NULL
    - [ ] `player_name` TEXT NOT NULL
    - [ ] `player_type` TEXT NOT NULL (Human, AI)
    - [ ] `team_number` INT NULL
    - [ ] `faction_type` TEXT NOT NULL
    - [ ] `game_result` TEXT NOT NULL (win, loss, tie, quit)
    - [ ] `eliminated` BOOLEAN NOT NULL DEFAULT FALSE
    - [ ] `eliminated_at` TIMESTAMP WITH TIME ZONE NULL
    - [ ] `final_score` INT NOT NULL DEFAULT 0
    - [ ] `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    - [ ] Indexes on game_session_id, user_id, game_result
    - [ ] UNIQUE index on (game_session_id, player_number)
  
  **Table 2: `probable_waffle_score_metric_types` (Metric catalog)**
    - [ ] `id` SERIAL PRIMARY KEY
    - [ ] `metric_key` TEXT NOT NULL UNIQUE (e.g., 'units_produced')
    - [ ] `metric_name` TEXT NOT NULL (e.g., 'Units Produced')
    - [ ] `metric_category` TEXT NOT NULL (units/buildings/resources/combat/economy)
    - [ ] `description` TEXT NULL
    - [ ] `display_order` INT NOT NULL DEFAULT 0
    - [ ] `is_active` BOOLEAN NOT NULL DEFAULT TRUE
    - [ ] Pre-populated with 20 standard metrics
    - [ ] UNIQUE index on metric_key
    - [ ] Index on metric_category
  
  **Table 3: `probable_waffle_player_score_metrics` (EAV values)**
    - [ ] `id` BIGSERIAL PRIMARY KEY
    - [ ] `player_score_id` BIGINT NOT NULL FK to player_scores
    - [ ] `metric_type_id` INT NOT NULL FK to metric_types
    - [ ] `metric_value` BIGINT NOT NULL DEFAULT 0
    - [ ] `created_at` TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    - [ ] UNIQUE index on (player_score_id, metric_type_id)
    - [ ] Indexes on both foreign keys
  
  **Materialized View: `probable_waffle_player_scores_full`**
    - [ ] Pivots EAV data into columns for performance
    - [ ] Contains all core fields + all 20 metrics as columns
    - [ ] Indexed on id, game_session_id, user_id
    - [ ] Refresh function: `refresh_probable_waffle_player_scores_full()`
  
  **Helper Functions:**
    - [ ] `get_player_score_metrics(player_score_id)` - Returns metrics as JSONB
    - [ ] `upsert_player_score_metric(player_score_id, metric_key, value)` - Upserts metric
  
  **Stats View: `probable_waffle_player_stats`**
    - [ ] Aggregates player statistics (wins, losses, averages)
    - [ ] Uses materialized view for performance
  
  **Benefits:**
    - ✅ Add new metrics without schema changes
    - ✅ Only store non-zero metrics (saves space)
    - ✅ Rich metadata for each metric (name, category, description)
    - ✅ Excellent query performance via materialized view
    - ✅ Easy to extend for new game modes
  
  **See `DBMs/DATABASE_DESIGN_SCORES.md` for detailed documentation**

### 12. API Service - Game Session Tracking
- [ ] Create `apps/api/src/app/probable-waffle/game-session/game-session.service.ts`
  - [ ] `createSession(gameInstanceId, gameType, mapId, createdByUserId, humanPlayerCount): Promise<void>`
  - [ ] `updateSessionState(gameInstanceId, sessionState): Promise<void>`
  - [ ] `endSession(gameInstanceId, endedAt): Promise<void>`
  - [ ] `getSession(gameInstanceId): Promise<GameSession | null>`
  - [ ] `checkScoresSubmitted(gameInstanceId): Promise<boolean>`
  - [ ] Use Supabase client to insert/update records

- [ ] Create `apps/api/src/app/probable-waffle/game-session/game-session.module.ts`
  - [ ] Export GameSessionService

- [ ] Update `apps/api/src/app/probable-waffle/probable-waffle.module.ts`
  - [ ] Import GameSessionModule

- [ ] Modify `apps/api/src/app/probable-waffle/matchmaking/matchmaking.service.ts`
  - [ ] In `createGameInstanceForMatchmaking()` after creating game instance:
    - [ ] Count human players in game instance
    - [ ] Call `GameSessionService.createSession()` with:
      - [ ] `gameInstanceId` (convert to UUID if needed)
      - [ ] `gameType` = `ProbableWaffleGameInstanceType.Matchmaking`
      - [ ] `mapId` from selected map
      - [ ] `createdByUserId` from first player/host
      - [ ] `humanPlayerCount` from game instance players array

- [ ] Modify `apps/api/src/app/probable-waffle/game-instance/game-instance.service.ts`
  - [ ] When creating online lobby game (non-matchmaking):
    - [ ] Count human players (filter by playerType === Human)
    - [ ] Call `GameSessionService.createSession()` with appropriate game type and count
  - [ ] When starting instant/skirmish game with server connection:
    - [ ] Call `GameSessionService.createSession()` if gameInstanceId exists
    - [ ] Count human players (typically 1 for single-player vs AI)

- [ ] Handle game session state changes:
  - [ ] When game ends (ToScoreScreen state), call `updateSessionState()`
  - [ ] Calculate and set `total_duration_seconds`
  - [ ] Set `ended_at` timestamp

### 13. API Controller - Score Submission
- [ ] Create `apps/api/src/app/probable-waffle/game-session/game-session.controller.ts`
  - [ ] `POST /probable-waffle/game-session/submit-scores`
    - [ ] Body: `{ gameInstanceId: UUID, playerScores: PlayerScoreData[], submittedByUserId: UUID }`
    - [ ] Validate game session exists
    - [ ] **Check if scores already submitted** (idempotent - return success if already done)
    - [ ] If already submitted, return existing data
    - [ ] **Transaction-based insert:**
      - [ ] For each player score:
        - [ ] Insert into `probable_waffle_player_scores` (core fields)
        - [ ] Get returned `player_score_id`
        - [ ] Batch insert all metrics into `probable_waffle_player_score_metrics`
      - [ ] Update `probable_waffle_game_sessions`:
        - [ ] SET `scores_submitted = true`
        - [ ] SET `scores_submitted_by = submittedByUserId`
        - [ ] SET `scores_submitted_at = NOW()`
        - [ ] SET `session_state = 'Completed'`
        - [ ] SET `ended_at = NOW()`
        - [ ] Calculate and SET `total_duration_seconds`
      - [ ] Refresh materialized view: `refresh_probable_waffle_player_scores_full()`
    - [ ] Return success with session info
  
  - [ ] `GET /probable-waffle/game-session/match-history`
    - [ ] Query `probable_waffle_match_history` view
    - [ ] Filter by current authenticated user (automatically via RLS)
    - [ ] Support pagination (limit/offset)
    - [ ] Return array of match summaries
  
  - [ ] `GET /probable-waffle/game-session/:gameInstanceId/details`
    - [ ] Query `probable_waffle_player_scores_full` view
    - [ ] Join with game session info
    - [ ] Return complete game details for score screen display
    - [ ] Verify current user participated in the game

- [ ] Add DTOs
  - [ ] `submit-scores.dto.ts`
    - [ ] `gameInstanceId: string` (UUID)
    - [ ] `playerScores: PlayerScoreData[]`
    - [ ] `submittedByUserId: string` (UUID)
  
  - [ ] `match-history.dto.ts`
    - [ ] `limit?: number` (default 20)
    - [ ] `offset?: number` (default 0)

### 14. Client - Score Submission & Match History

#### Score Submission Logic
- [ ] Modify `apps/client/src/app/probable-waffle/gui/score-screen/score-screen.component.ts`
  - [ ] In `ngOnInit()`:
    - [ ] Check if online and game has `gameInstanceId`
    - [ ] Check if current user is the last human player to exit
    - [ ] **Determine if should submit:**
      - [ ] Count human players in game instance
      - [ ] Check if all other human players have `leftOrKilled = true`
      - [ ] If current user is last → submit scores
      - [ ] If not last → skip submission (another player will submit)
    - [ ] Call `ScoreSubmissionService.submitScores()` only if last player
    - [ ] Pass `submittedByUserId` (current user's ID)

- [ ] Create `apps/client/src/app/probable-waffle/services/score-submission.service.ts`
  - [ ] `submitScores(gameInstanceId: string, playerScores: PlayerScoreData[], submittedByUserId: string): Observable<void>`
  - [ ] POST to `/api/probable-waffle/game-session/submit-scores`
  - [ ] Handle errors gracefully (offline mode should not fail)
  - [ ] Return success even if already submitted (idempotent)
  
  - [ ] `isLastHumanPlayer(gameInstance: ProbableWaffleGameInstance, currentUserId: string): boolean`
    - [ ] Filter human players from game instance
    - [ ] Check if all others have `leftOrKilled = true`
    - [ ] Return true if current user is last remaining

#### Match History Feature
- [ ] Create `apps/client/src/app/probable-waffle/gui/match-history/match-history-page.component.ts`
  - [ ] Inject `MatchHistoryService`
  - [ ] Load match history on init
  - [ ] Display list of matches with:
    - [ ] Date played
    - [ ] Map name
    - [ ] Game duration
    - [ ] Player result (Win/Loss/Tie)
    - [ ] Number of players
    - [ ] Faction used
  - [ ] Click handler to navigate to score details

- [ ] Create `apps/client/src/app/probable-waffle/gui/match-history/match-history-page.component.html`
  - [ ] Table/list view of matches
  - [ ] Sortable columns
  - [ ] Pagination controls
  - [ ] Click row → navigate to `/probable-waffle/match-details/:gameInstanceId`

- [ ] Create `apps/client/src/app/probable-waffle/services/match-history.service.ts`
  - [ ] `getMatchHistory(limit: number, offset: number): Observable<MatchHistorySummary[]>`
    - [ ] GET `/api/probable-waffle/game-session/match-history?limit={limit}&offset={offset}`
  - [ ] `getMatchDetails(gameInstanceId: string): Observable<GameSessionDetails>`
    - [ ] GET `/api/probable-waffle/game-session/${gameInstanceId}/details`
    - [ ] Returns full score data for display

- [ ] Create `apps/client/src/app/probable-waffle/gui/match-history/match-details.component.ts`
  - [ ] Route: `/probable-waffle/match-details/:gameInstanceId`
  - [ ] Load game details from API
  - [ ] **Reuse existing score-screen.component for display:**
    - [ ] Extract score display into shared component
    - [ ] Pass loaded data instead of reading from `GameInstanceClientService`
    - [ ] Show "Back to Match History" button

- [ ] Add routing
  - [ ] `/probable-waffle/match-history` → MatchHistoryPageComponent
  - [ ] `/probable-waffle/match-details/:gameInstanceId` → MatchDetailsComponent

- [ ] Add navigation link
  - [ ] In main menu: "Match History" button
  - [ ] Shows user's game history

---

### 15. Match History UI Components
- [ ] Create `match-history-page.component.html`
  ```html
  <div class="match-history-container">
    <h1>Match History</h1>
    
    <table class="match-history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Map</th>
          <th>Duration</th>
          <th>Result</th>
          <th>Players</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let match of matches" (click)="viewDetails(match.game_instance_id)">
          <td>{{ match.ended_at | date }}</td>
          <td>{{ getMapName(match.map_id) }}</td>
          <td>{{ formatDuration(match.total_duration_seconds) }}</td>
          <td [class]="'result-' + match.user_result">{{ match.user_result }}</td>
          <td>{{ match.human_player_count }} players</td>
          <td><button>View Details</button></td>
        </tr>
      </tbody>
    </table>
    
    <div class="pagination">
      <button (click)="previousPage()" [disabled]="offset === 0">Previous</button>
      <span>Page {{ currentPage }}</span>
      <button (click)="nextPage()" [disabled]="!hasMore">Next</button>
    </div>
  </div>
  ```

- [ ] Create `match-details.component.html`
  ```html
  <div class="match-details-container">
    <div class="header">
      <button (click)="backToHistory()">← Back to Match History</button>
      <h1>Match Details</h1>
    </div>
    
    <div class="game-info">
      <p>Map: {{ gameSession.map_id }}</p>
      <p>Date: {{ gameSession.ended_at | date:'medium' }}</p>
      <p>Duration: {{ formatDuration(gameSession.total_duration_seconds) }}</p>
    </div>
    
    <!-- Reuse existing score screen components -->
    <probable-waffle-score-table [playerScores]="playerScores"></probable-waffle-score-table>
    <probable-waffle-score-through-time [playerScores]="playerScores"></probable-waffle-score-through-time>
  </div>
  ```

- [ ] Style components with appropriate CSS
  - [ ] Table styling with hover effects
  - [ ] Result badges (green for win, red for loss, yellow for tie)
  - [ ] Responsive design for mobile
  - [ ] Loading states and error handling

---

## System Architecture

### Data Flow Diagram
```
┌─────────────────────────────────────────────────────────────────────┐
│ GAME RUNTIME (Client)                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ProbableWaffleScene                                                │
│    ├── ScoreTracker (new)                                           │
│    │   ├── Monitors: PlayerState.summary[]                          │
│    │   ├── Tracks: actor counts, resources, damage, healing         │
│    │   ├── Creates: periodic snapshots (every 5s)                   │
│    │   └── Stores: GameState.scoreData Map<PlayerNumber, ScoreData> │
│    │                                                                 │
│    └── GameModeConditionChecker                                     │
│        ├── Calls: ScoreTracker.setPlayerResult() on win/loss/tie   │
│        └── Triggers: Navigation to Score Screen                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SCORE SCREEN (Client)                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ScoreScreenComponent                                               │
│    ├── ScoreDataService (reads GameState.scoreData)                │
│    ├── ScoreTableComponent (displays final stats table)            │
│    ├── ScoreThroughTimeComponent (displays charts from snapshots)  │
│    └── ScoreSubmissionService (submits to API if online)           │
│          ├── Check if last human player (all others leftOrKilled)  │
│          └── Submit only if last player                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (if online AND last human player)
┌─────────────────────────────────────────────────────────────────────┐
│ API BACKEND (Server)                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  GameSessionController                                              │
│    ├── POST /game-session/submit-scores (idempotent)               │
│    │     └── GameSessionService                                     │
│    │          ├── Validates session exists                          │
│    │          ├── Checks if already submitted                       │
│    │          └── Saves all players' scores (transaction)           │
│    │                                                                 │
│    ├── GET /game-session/match-history (paginated)                 │
│    │     └── Returns user's game history                            │
│    │                                                                 │
│    └── GET /game-session/:id/details                                │
│          └── Returns full score data for one game                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE (Supabase)                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  probable_waffle_game_sessions                                      │
│    └── [game_instance_id, game_type, map_id, session_state, ...]  │
│          │                                                          │
│          └──┐                                                       │
│             │ (FK)                                                  │
│             ▼                                                       │
│  probable_waffle_player_scores                                      │
│    └── [game_session_id, user_id, player_number, stats, ...]      │
│                                                                     │
│  messages                                                           │
│    └── [game_instance_id (FK to sessions), ...]                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Session Creation Flow
```
Matchmaking/Lobby Start
  └─> MatchmakingService.createGameInstanceForMatchmaking()
       └─> Count human players in game instance
            └─> GameSessionService.createSession()
                 └─> INSERT INTO probable_waffle_game_sessions
                      (game_instance_id, game_type, map_id, 
                       created_by_user_id, human_player_count)

Game Ends
  └─> GameModeConditionChecker.navigateToScoreScreen()
       └─> Changes session state to ToScoreScreen
            └─> GameSessionService.updateSessionState()
                 └─> UPDATE probable_waffle_game_sessions
                      SET session_state = 'ToScoreScreen'

Score Screen Loaded (Last Human Player Only)
  └─> ScoreScreenComponent.ngOnInit()
       └─> Check if last human player:
            ├─> Count human players in game instance
            ├─> Check if all others have leftOrKilled = true
            └─> If last player:
                 └─> ScoreSubmissionService.submitScores()
                      └─> POST /api/probable-waffle/game-session/submit-scores
                           └─> GameSessionService.savePlayerScores()
                                ├─> INSERT INTO probable_waffle_player_scores (all players)
                                ├─> INSERT INTO probable_waffle_player_score_metrics (batch)
                                └─> UPDATE probable_waffle_game_sessions
                                     SET scores_submitted = true,
                                         scores_submitted_by = current_user_id,
                                         scores_submitted_at = NOW(),
                                         session_state = 'Completed',
                                         ended_at = NOW()
```

### Match History Flow
```
User Opens Match History
  └─> MatchHistoryPageComponent.ngOnInit()
       └─> MatchHistoryService.getMatchHistory(limit, offset)
            └─> GET /api/probable-waffle/game-session/match-history
                 └─> Query probable_waffle_match_history view
                      ├─> Filters: user_participated = true, scores_submitted = true
                      ├─> Returns: list of games with player results
                      └─> Ordered by: ended_at DESC

User Clicks on Match
  └─> Navigate to /probable-waffle/match-details/:gameInstanceId
       └─> MatchDetailsComponent.ngOnInit()
            └─> MatchHistoryService.getMatchDetails(gameInstanceId)
                 └─> GET /api/probable-waffle/game-session/:id/details
                      └─> Query probable_waffle_player_scores_full view
                           ├─> Join with game session info
                           ├─> Verify user participated
                           └─> Return full score data for display

Display Match Details
  └─> Reuse ScoreScreenComponent with loaded data
       ├─> Show all players' scores
       ├─> Show charts from snapshot data (if available)
       └─> "Back to Match History" button
```

### Component Flow
```
ProbableWaffleScene
  ├── GameModeConditionChecker (sets game results)
  ├── ScoreTracker (collects data)
  │     ├── Listens to PlayerState.summary
  │     ├── Monitors actor counts via ScenePlayerHelpers
  │     ├── Creates periodic snapshots
  │     └── Stores in GameState.scoreData
  └── Game ends → Navigate to Score Screen

ScoreScreenComponent
  ├── ScoreDataService (reads GameState.scoreData)
  ├── ScoreTableComponent (displays final stats)
  └── ScoreThroughTimeComponent (displays charts from snapshots)
```

---

## Implementation Order

1. Backend data structures (Task 1) ✅ COMPLETE
2. ScoreTracker core class (Task 2) ✅ COMPLETE
3. Event-based data collection (Task 3) ✅ COMPLETE
4. Game result tracking (Task 4) ✅ COMPLETE
5. Scene integration (Task 5) ✅ COMPLETE
6. Score data service (Task 6) ✅ COMPLETE
7. UI updates (Tasks 7-9) ✅ PARTIAL (Task 7 complete, 8-9 TODO)
8. Database schema - game sessions table (Task 10) ✅ COMPLETE (migration ready)
9. Database schema - player scores table (Task 11) ✅ COMPLETE (migration ready)
10. API service - game session tracking (Task 12) ✅ COMPLETE
11. API controller - score submission (Task 13) ✅ COMPLETE
12. Client - score submission with last human player logic (Task 14) ✅ COMPLETE
13. Client - match history UI components (Task 15) 🔄 TODO

---

## Database Migration Order

**Important**: Migration 0003 has been updated to use UUID for `game_instance_id` and includes FK to game sessions.

Run migrations in this order:
1. `DBMs/0007_probable_waffle_game_sessions.sql` - Creates game sessions table
2. `DBMs/0003_messages.sql` - Creates messages table (now with UUID game_instance_id and FK to sessions)
3. `DBMs/0008_probable_waffle_player_scores.sql` - Creates player scores table (depends on sessions table)

**Note**: If `0003_messages.sql` was already run in your database, you'll need to run `0007` first, then manually update the messages table with:
```sql
-- Add foreign key to existing messages table
ALTER TABLE messages 
  ADD CONSTRAINT messages_game_instance_id_fkey 
  FOREIGN KEY (game_instance_id) REFERENCES probable_waffle_game_sessions (game_instance_id) ON DELETE SET NULL;

COMMENT ON COLUMN messages.game_instance_id IS 'References the game instance UUID from probable_waffle_game_sessions';
```

---

## Files to Create/Modify

### New Files
**Database Migrations:**
- `DBMs/0007_probable_waffle_game_sessions.sql` ✓ Created
- `DBMs/0008_probable_waffle_player_scores.sql` ✓ Created

**Modified Migrations:**
- `DBMs/0003_messages.sql` ✓ Updated (game_instance_id now UUID with FK to sessions)

**API Interfaces:**
- `libs/api-interfaces/src/lib/game-instance/probable-waffle/score-data.ts`

**Client Game Logic:**
- `apps/client/src/app/probable-waffle/game/world/state/ScoreTracker.ts`
- `apps/client/src/app/probable-waffle/services/score-data.service.ts`
- `apps/client/src/app/probable-waffle/services/score-submission.service.ts`
- `apps/client/src/app/probable-waffle/services/match-history.service.ts`

**Client Components (Match History):**
- `apps/client/src/app/probable-waffle/gui/match-history/match-history-page.component.ts`
- `apps/client/src/app/probable-waffle/gui/match-history/match-history-page.component.html`
- `apps/client/src/app/probable-waffle/gui/match-history/match-history-page.component.scss`
- `apps/client/src/app/probable-waffle/gui/match-history/match-details.component.ts`
- `apps/client/src/app/probable-waffle/gui/match-history/match-details.component.html`
- `apps/client/src/app/probable-waffle/gui/match-history/match-details.component.scss`

**API Services:**
- `apps/api/src/app/probable-waffle/game-session/game-session.service.ts`
- `apps/api/src/app/probable-waffle/game-session/game-session.module.ts`
- `apps/api/src/app/probable-waffle/game-session/game-session.controller.ts`
- `apps/api/src/app/probable-waffle/game-session/dto/submit-scores.dto.ts`
- `apps/api/src/app/probable-waffle/game-session/dto/match-history.dto.ts`

### Files to Modify
**Client:**
- `apps/client/src/app/probable-waffle/game/world/state/GameModeConditionChecker.ts`
- `apps/client/src/app/probable-waffle/game/core/probable-waffle.scene.ts`
- `apps/client/src/app/probable-waffle/gui/score-screen/score-screen.component.ts`
- `apps/client/src/app/probable-waffle/gui/score-screen/table/score-table.component.ts`
- `apps/client/src/app/probable-waffle/gui/score-screen/chart/score-through-time.component.ts`

**API:**
- `apps/api/src/app/probable-waffle/probable-waffle.module.ts`
- `apps/api/src/app/probable-waffle/matchmaking/matchmaking.service.ts`
- `apps/api/src/app/probable-waffle/game-instance/game-instance.service.ts`

**Shared:**
- `libs/api-interfaces/src/lib/game-instance/probable-waffle/game-state.ts`
- `libs/api-interfaces/src/index.ts`

---

## Notes

- No tests required
- Use throttle for performance (similar to `GameModeConditionChecker`)
- Support both human and AI players
- Support team games (multiple players per team)
- Handle edge cases (player disconnects, surrenders)
- Ensure data is available when navigating to score screen
- **Multiplayer sync not needed** - each client collects data independently from shared game state
- **Offline support** - persistence only happens when game has `gameInstanceId` and server is available
- Game session tracking starts when matchmaking creates game or when online lobby starts
- Score submission is idempotent - can be called multiple times safely
- **Last human player to exit submits scores** - prevents duplicate submissions and ensures all player data is complete
- **Match history** - players can view their past games and click to see detailed score screens
- **Human player tracking** - database stores count of human players to validate submission logic









