# PW-001: Score Screen Data Collection System

## Quick Start

**Goal**: Implement a comprehensive score tracking system for Probable Waffle RTS that collects player statistics throughout the game and persists them to a database for analysis.

**Key Changes**:
- ✅ Database migrations created/updated (2 new + 1 updated in `DBMs/` folder)
- ✅ Score tracking system (similar to `GameModeConditionChecker`)
- ✅ API endpoints for session and score persistence
- ✅ UI updates to display comprehensive player statistics
- ✅ Offline mode support (no persistence when server unavailable)

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

**See `DBMs/0007_probable_waffle_game_sessions.sql` and `DBMs/0008_probable_waffle_player_scores.sql` for full schema.**

---

## Backend / API Interfaces

### 1. Score Data Structures ✅ COMPLETE
- [x] `PlayerScoreData`, `ScoreMetricType`, `STANDARD_METRICS`, `GameScoreSnapshot`, `PlayerScoreSnapshot`
- [x] `MatchHistorySummary`, `GameSessionDetails`
- [x] `scoreData` + `scoreSnapshots` added to `ProbableWaffleGameStateData`
- [x] Exported from `libs/api-interfaces/src/index.ts`

---

## Client / Game Logic

### 2. Score Tracker Service ✅ COMPLETE
- [x] `apps/client/src/app/probable-waffle/game/world/state/ScoreTracker.ts`
  - [x] Initialize score data for all players
  - [x] Set up lifecycle hooks (create, update, shutdown)

### 3. Data Collection Methods ✅ COMPLETE
- [x] `initializePlayerScores()`
- [x] `updateScores()` (throttled to 1000ms)
- [x] `setMetric()` / `incrementMetric()` helpers
- [x] `recordEvent()` — unit_produced, unit_killed, building_constructed, building_destroyed, resource_collected, resource_spent
- [x] `trackDamage()` — damage_dealt, damage_received
- [x] `trackHealing()` — healing_done
- [x] `createSnapshot()` every 5s

### 4. Game Result Tracking ✅ COMPLETE
- [x] `GameModeConditionChecker.winGame()` → `setPlayerResult('win')` / enemies `'loss'`
- [x] `GameModeConditionChecker.loseGame()` → `setPlayerResult('loss')` / enemies `'win'`
- [x] `GameModeConditionChecker.tieGame()` → all `'tie'`
- [x] `GameModeConditionChecker.selfQuit()` → `setPlayerResult('quit')`
- [x] Player elimination tracking (eliminated + eliminatedAt)

### 5. Integration with Game Scene ✅ COMPLETE
- [x] `ScoreTracker` instantiated in `ProbableWaffleScene.create()` after `GameModeConditionChecker`
- [x] Cleanup on scene shutdown

---

## Frontend / Score Screen UI

### 6. Score Data Service ✅ COMPLETE
- [x] `apps/client/src/app/probable-waffle/services/score-data.service.ts`
  - [x] `getPlayerScore()`, `getAllPlayerScores()`, `getSortedPlayersByScore()`, `getScoreSnapshots()`

### 7. Update Score Screen Component ✅ COMPLETE
- [x] `score-screen.component.ts` — injects `ScoreSubmissionService`, submits on init
- [x] `score-screen.component.html` — tabs: Score Table, Units, Buildings, Resources

### 8. Update Score Table Component ✅ COMPLETE
- [x] `score-table.component.ts` — accepts `playerScores` input, falls back to `ScoreDataService`
- [x] All columns: Player Name, Result, Final Score, Units Produced/Killed/Lost, Buildings Built/Destroyed/Lost, Resources Collected/Spent/Final (per mineral/stone/wood), Damage Dealt/Received, Healing Done, Max Army
- [x] Group headers, horizontal scroll, result badge colours

### 9. Update Chart Component ✅ COMPLETE
- [x] `score-through-time.component.ts` — uses `ScoreDataService.getScoreSnapshots()` (snapshot-based)
- [x] Chart types: Unit Count, Building Count, Total Resources, Army Value (dropdown selector)
- [x] Consolidated into single "Stats Over Time" tab

---

## Data Persistence

### 10. Database Schema - Game Sessions Table ✅ COMPLETE
- [x] `DBMs/0007_probable_waffle_game_sessions.sql` — table + match_history view

### 11. Database Schema - Player Scores Tables ✅ COMPLETE
- [x] `DBMs/0008_probable_waffle_player_scores.sql` — 3-table EAV design + materialized view + helpers

### 12. API Service - Game Session Tracking ✅ COMPLETE
- [x] `apps/api/src/app/probable-waffle/game-session/game-session.service.ts`
  - [x] `createSession()`, `updateSessionState()`, `endSession()`, `getSession()`, `checkScoresSubmitted()`
- [x] `game-session.module.ts` registered in `probable-waffle.module.ts`
- [x] Matchmaking service calls `createSession()` with `humanPlayerCount`
- [x] `game-instance.service.ts` creates session for online lobby/skirmish games

### 13. API Controller - Score Submission ✅ COMPLETE
- [x] `POST /probable-waffle/game-session/submit-scores` — idempotent, transactional
- [x] `GET /probable-waffle/game-session/match-history` — paginated, RLS-filtered
- [x] `GET /probable-waffle/game-session/:gameInstanceId/details` — full score data
- [x] DTOs: `submit-scores.dto.ts`, `match-history.dto.ts`

### 14. Client - Score Submission ✅ COMPLETE
- [x] `score-submission.service.ts` — `isLastHumanPlayer()`, `getAllPlayerScores()`, `submitScores()`
- [x] `ScoreScreenComponent.ngOnInit()` — submits only if online and last human player

### 15. Match History UI Components ✅ COMPLETE
- [x] `match-history-page.component.*` — table, pagination, result badges
- [x] `match-details.component.*` — loads details, reuses `ScoreTableComponent`
- [x] `MatchHistoryService` — `getMatchHistory()`, `getMatchDetails()`
- [x] Routes: `/aota/match-history`, `/aota/match-details/:gameInstanceId`
- [x] Navigation: "Match History" button in main menu (dev mode only)

---

## Implementation Order

1. Backend data structures (Task 1) ✅ COMPLETE
2. ScoreTracker core class (Task 2) ✅ COMPLETE
3. Event-based data collection (Task 3) ✅ COMPLETE
4. Game result tracking (Task 4) ✅ COMPLETE
5. Scene integration (Task 5) ✅ COMPLETE
6. Score data service (Task 6) ✅ COMPLETE
7. UI updates (Tasks 7-9) ✅ COMPLETE
8. Database schema - game sessions table (Task 10) ✅ COMPLETE
9. Database schema - player scores table (Task 11) ✅ COMPLETE
10. API service - game session tracking (Task 12) ✅ COMPLETE
11. API controller - score submission (Task 13) ✅ COMPLETE
12. Client - score submission with last human player logic (Task 14) ✅ COMPLETE
13. Client - match history UI components (Task 15) ✅ COMPLETE

---

## Database Migration Order

Run migrations in this order:
1. `DBMs/0007_probable_waffle_game_sessions.sql`
2. `DBMs/0003_messages.sql` (FK to game sessions added)
3. `DBMs/0008_probable_waffle_player_scores.sql`

**Note**: If `0003_messages.sql` was already run, manually add the FK:
```sql
ALTER TABLE messages
  ADD CONSTRAINT messages_game_instance_id_fkey
  FOREIGN KEY (game_instance_id) REFERENCES probable_waffle_game_sessions (game_instance_id) ON DELETE SET NULL;
COMMENT ON COLUMN messages.game_instance_id IS 'References the game instance UUID from probable_waffle_game_sessions';
```

---

## Notes

- No tests required
- Use throttle for performance (similar to `GameModeConditionChecker`)
- Support both human and AI players
- **Multiplayer sync not needed** — each client collects data independently from shared game state
- **Offline support** — persistence only when game has `gameInstanceId` and server is available
- Score submission is idempotent — safe for simultaneous exit race conditions
- **Last human player to exit submits scores** — prevents duplicates, ensures all player data is complete
- Materialized view must be refreshed after bulk inserts: `SELECT refresh_probable_waffle_player_scores_full()`
