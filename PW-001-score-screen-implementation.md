# PW-001: Score Screen Data Collection System

## Goal
Implement a comprehensive score tracking system for Probable Waffle RTS that collects player statistics throughout the game and persists them to a database.

## Database Design
Hybrid EAV design — see `DBMs/0007_probable_waffle_game_sessions.sql` and `DBMs/0008_probable_waffle_player_scores.sql` for schema and rationale.

**Multiplayer submission:** Only the last human player to reach the score screen submits all scores. API is idempotent. See `DBMs/0007` header comment for details.

---

## Implementation Status

### Task 1: API Interfaces ✅ COMPLETE
- `libs/api-interfaces/src/lib/game-instance/probable-waffle/score-data.ts`
  - `PlayerScoreData`, `ScoreMetricType`, `STANDARD_METRICS`, `GameScoreSnapshot`, `PlayerScoreSnapshot`
  - `MatchHistorySummary`, `GameSessionDetails`
- Exported from `libs/api-interfaces/src/index.ts`
- `scoreData` added to `ProbableWaffleGameStateData`

### Task 2–5: ScoreTracker (Game Logic) ✅ COMPLETE
- `apps/client/src/app/probable-waffle/game/world/state/ScoreTracker.ts`
  - `initializePlayerScores()`, `updateScores()` (throttled 1000ms)
  - `setMetric()`, `incrementMetric()` helpers
  - `recordEvent()` — units produced/killed, buildings constructed/destroyed, resources collected/spent
  - `trackDamage()`, `trackHealing()`
  - `createSnapshot()` every 5s
  - `setPlayerResult()` for win/loss/tie/quit
- `GameModeConditionChecker` calls ScoreTracker on win/loss/tie/quit
- `ProbableWaffleScene` instantiates ScoreTracker after GameModeConditionChecker

### Task 6: Score Data Service ✅ COMPLETE
- `apps/client/src/app/probable-waffle/services/score-data.service.ts`
  - `getPlayerScore()`, `getAllPlayerScores()`, `getSortedPlayersByScore()`, `getScoreSnapshots()`

### Task 7–9: Score Screen UI ✅ PARTIAL
- `ScoreScreenComponent` — injects `ScoreSubmissionService` and `AuthService`, submits on init ✅
- `ScoreTableComponent` — accepts `playerScores` input, displays core metrics ✅
- `ScoreThroughTimeComponent` — 🔄 TODO (chart with snapshot data, chart type selector)

### Task 10–11: Database Migrations ✅ COMPLETE
- `DBMs/0007_probable_waffle_game_sessions.sql` — game sessions table + match_history view
- `DBMs/0008_probable_waffle_player_scores.sql` — player scores + EAV metrics + materialized view

### Task 12: API Service — Game Session Tracking ✅ COMPLETE
- `apps/api/src/app/probable-waffle/game-session/game-session.service.ts`
  - `createSession()`, `updateSessionState()`, `endSession()`, `getSession()`, `checkScoresSubmitted()`
- `game-session.module.ts` registered in `probable-waffle.module.ts`
- Matchmaking service calls `createSession()` with `humanPlayerCount`
- `game-instance.service.ts` creates session for online lobby/skirmish games

### Task 13: API Controller — Score Submission ✅ COMPLETE
- `apps/api/src/app/probable-waffle/game-session/game-session.controller.ts`
  - `POST /probable-waffle/game-session/submit-scores` — idempotent, transactional
  - `GET /probable-waffle/game-session/match-history` — paginated, RLS-filtered
  - `GET /probable-waffle/game-session/:gameInstanceId/details` — full score data
- DTOs: `submit-scores.dto.ts`, `match-history.dto.ts`

### Task 14: Client — Score Submission ✅ COMPLETE
- `apps/client/src/app/probable-waffle/services/score-submission.service.ts`
  - `isLastHumanPlayer()` — checks all other humans have `leftOrKilled = true`
  - `getAllPlayerScores()` — collects from game instance
  - `submitScores()` — POST to API, graceful on error/offline
- `ScoreScreenComponent.ngOnInit()` — submits only if online and last human player

### Task 15: Match History UI ✅ COMPLETE
- `apps/client/src/app/probable-waffle/gui/match-history/match-history-page.component.*`
  - Table of past matches, pagination, result badges, map name lookup
- `apps/client/src/app/probable-waffle/gui/match-history/match-details.component.*`
  - Loads game details, reuses `ScoreTableComponent`
- `MatchHistoryService` — `getMatchHistory()`, `getMatchDetails()`
- Routes: `/aota/match-history`, `/aota/match-details/:gameInstanceId`
- Navigation: "Match History" button in main menu (dev mode only)

---

## Remaining TODOs

### 9. Score Through Time Chart 🔄 TODO
- `apps/client/src/app/probable-waffle/gui/score-screen/chart/score-through-time.component.ts`
  - Accept `scoreSnapshots` from `ScoreDataService`
  - Chart types: army size, building count, total resources, army value over time
  - Chart type selector (dropdown)

---

## Database Migration Order
1. `DBMs/0007_probable_waffle_game_sessions.sql`
2. `DBMs/0003_messages.sql` (FK to game sessions added)
3. `DBMs/0008_probable_waffle_player_scores.sql`

## Notes
- No tests required
- Offline support: no persistence when `gameInstanceId` is absent
- Score submission is idempotent (safe for simultaneous exit race conditions)
- AI players are included in score submission with `user_id = null`
- Materialized view must be refreshed after bulk inserts: `SELECT refresh_probable_waffle_player_scores_full()`
